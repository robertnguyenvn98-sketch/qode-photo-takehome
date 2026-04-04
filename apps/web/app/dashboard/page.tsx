'use client';

import {
  CloudUploadOutlined,
  CommentOutlined,
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Skeleton,
  Space,
  Typography,
  Upload,
  message,
} from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Paragraph, Text, Title } = Typography;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function sanitizeForDisplay(value: string) {
  return value.replace(/[<>]/g, '');
}

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
};

type CommentItem = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
};

type Photo = {
  id: string;
  userId: string;
  secureUrl: string;
  thumbnailUrl?: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
  uploader?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  latestComments?: CommentItem[];
};

type PhotosResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Photo[];
};

type CommentsResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: CommentItem[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();
  const [messageApi, contextHolder] = message.useMessage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentsByPhoto, setCommentsByPhoto] = useState<Record<string, CommentItem[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, status]);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const response = await fetch('/api/me');
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? 'Failed to load profile');
      }
      setProfile(body as Profile);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  }, [messageApi]);

  const loadPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    try {
      const response = await fetch('/api/photos?page=1&pageSize=12');
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? 'Failed to load photos');
      }
      const payload = body as PhotosResponse;
      setPhotos(payload.items);
      const cachedComments: Record<string, CommentItem[]> = {};
      payload.items.forEach((item) => {
        cachedComments[item.id] = item.latestComments ?? [];
      });
      setCommentsByPhoto(cachedComments);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Failed to load photos');
    } finally {
      setLoadingPhotos(false);
    }
  }, [messageApi]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void loadProfile();
    void loadPhotos();
  }, [loadPhotos, loadProfile, status]);

  const beforeUpload = useCallback(
    (file: RcFile) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        messageApi.error('Only JPEG, PNG, or WEBP files are allowed.');
        return Upload.LIST_IGNORE;
      }

      if (file.size > MAX_FILE_SIZE) {
        messageApi.error('File size must be 5 MB or less.');
        return Upload.LIST_IGNORE;
      }

      setFileList([
        {
          uid: file.name,
          name: file.name,
          status: 'done',
          originFileObj: file,
        },
      ]);

      return Upload.LIST_IGNORE;
    },
    [messageApi],
  );

  const uploadPhoto = useCallback(async () => {
    const selected = fileList[0]?.originFileObj;
    if (!selected) {
      messageApi.warning('Please choose an image first.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selected);

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? 'Upload failed');
      }

      messageApi.success('Photo uploaded successfully');
      setFileList([]);
      await loadPhotos();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [fileList, loadPhotos, messageApi]);

  const loadComments = useCallback(async (photoId: string) => {
    setLoadingComments((prev) => ({ ...prev, [photoId]: true }));
    try {
      const response = await fetch(`/api/photos/${photoId}/comments?page=1&pageSize=20`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? 'Failed to load comments');
      }
      const payload = body as CommentsResponse;
      setCommentsByPhoto((prev) => ({
        ...prev,
        [photoId]: payload.items,
      }));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Failed to load comments');
    } finally {
      setLoadingComments((prev) => ({ ...prev, [photoId]: false }));
    }
  }, [messageApi]);

  const submitComment = useCallback(async (photoId: string) => {
    const raw = commentDrafts[photoId] ?? '';
    const content = raw.trim();

    if (!content) {
      messageApi.warning('Comment content cannot be empty.');
      return;
    }

    if (content.length > 500) {
      messageApi.warning('Comment must be 500 characters or fewer.');
      return;
    }

    setSubmittingComment((prev) => ({ ...prev, [photoId]: true }));
    try {
      const response = await fetch(`/api/photos/${photoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message ?? 'Failed to add comment');
      }

      messageApi.success('Comment added');
      setCommentDrafts((prev) => ({ ...prev, [photoId]: '' }));
      await loadComments(photoId);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Failed to add comment');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [photoId]: false }));
    }
  }, [commentDrafts, loadComments, messageApi]);

  const photoCards = useMemo(() => {
    if (loadingPhotos) {
      return Array.from({ length: 3 }).map((_, index) => (
        <Card key={`skeleton-${index}`} className="photo-card">
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>
      ));
    }

    if (!photos.length) {
      return <Empty description="No photos uploaded yet" />;
    }

    return photos.map((photo) => {
      const comments = commentsByPhoto[photo.id] ?? [];

      return (
        <Card
          key={photo.id}
          className="photo-card"
          cover={<img className="photo-image" src={photo.thumbnailUrl ?? photo.secureUrl} alt="Uploaded" />}
          actions={[
            <Button
              key="refresh"
              type="link"
              icon={<ReloadOutlined />}
              loading={loadingComments[photo.id]}
              onClick={() => void loadComments(photo.id)}
            >
              Refresh comments
            </Button>,
          ]}
        >
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Text type="secondary">
              Uploaded by {photo.uploader?.name ?? 'Unknown'} · {new Date(photo.createdAt).toLocaleString()}
            </Text>
            <Text>
              {photo.width}x{photo.height} · {Math.round(photo.bytes / 1024)} KB · {photo.format.toUpperCase()}
            </Text>

            <div>
              <Text strong>
                <CommentOutlined /> Comments
              </Text>
              {comments.length ? (
                <List
                  size="small"
                  dataSource={comments}
                  renderItem={(comment) => (
                    <List.Item key={comment.id}>
                      <Space direction="vertical" size={0}>
                        <Text>{sanitizeForDisplay(comment.content)}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No comments yet" />
              )}
            </div>

            <Form layout="vertical" onFinish={() => void submitComment(photo.id)}>
              <Form.Item
                style={{ marginBottom: 8 }}
                validateStatus={(commentDrafts[photo.id] ?? '').length > 500 ? 'error' : undefined}
                help={
                  (commentDrafts[photo.id] ?? '').length > 500
                    ? 'Comment must be 500 characters or fewer.'
                    : undefined
                }
              >
                <Input.TextArea
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  placeholder="Add a comment"
                  value={commentDrafts[photo.id] ?? ''}
                  maxLength={520}
                  onChange={(event) =>
                    setCommentDrafts((prev) => ({
                      ...prev,
                      [photo.id]: event.target.value,
                    }))
                  }
                />
              </Form.Item>
              <Button
                htmlType="submit"
                type="primary"
                loading={submittingComment[photo.id]}
                disabled={!(commentDrafts[photo.id] ?? '').trim()}
              >
                Add comment
              </Button>
            </Form>
          </Space>
        </Card>
      );
    });
  }, [
    commentDrafts,
    commentsByPhoto,
    loadComments,
    loadingComments,
    loadingPhotos,
    photos,
    submitComment,
    submittingComment,
  ]);

  if (status === 'loading') {
    return (
      <div className="app-shell">
        <div className="content-wrap">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="app-shell">
      {contextHolder}
      <div className="content-wrap">
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Title level={2} style={{ margin: 0 }}>
              Photo Dashboard
            </Title>
            <Button icon={<LogoutOutlined />} onClick={() => signOut({ callbackUrl: '/login' })}>
              Sign out
            </Button>
          </Space>

          <div className="dashboard-grid">
            <Space direction="vertical" size={16}>
              <Card>
                {loadingProfile ? (
                  <Skeleton active avatar paragraph={{ rows: 2 }} />
                ) : profile ? (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space>
                      <Avatar
                        size={56}
                        src={profile.avatarUrl ?? undefined}
                        icon={<UserOutlined />}
                      />
                      <div>
                        <Title level={4} style={{ margin: 0 }}>
                          {profile.name ?? 'Unnamed User'}
                        </Title>
                        <Text type="secondary">{profile.email}</Text>
                      </div>
                    </Space>
                    <Text>Role: {profile.role}</Text>
                  </Space>
                ) : (
                  <Empty description="Profile unavailable" />
                )}
              </Card>

              <Card title="Upload Photo" extra={<CloudUploadOutlined />}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Paragraph style={{ marginBottom: 0, color: 'var(--text-muted)' }}>
                    Allowed: JPEG, PNG, WEBP. Max size: 5 MB.
                  </Paragraph>

                  <Upload
                    accept={ALLOWED_MIME_TYPES.join(',')}
                    maxCount={1}
                    fileList={fileList}
                    beforeUpload={beforeUpload}
                    onRemove={() => {
                      setFileList([]);
                      return true;
                    }}
                  >
                    <Button>Select file</Button>
                  </Upload>

                  <Button type="primary" loading={uploading} onClick={() => void uploadPhoto()}>
                    Upload
                  </Button>
                </Space>
              </Card>
            </Space>

            <Space direction="vertical" size={16}>
              <Card title="Photo Feed">{photoCards}</Card>
            </Space>
          </div>
        </Space>
      </div>
    </div>
  );
}
