'use client';

import { GoogleCircleFilled, LoginOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography } from 'antd';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const { Paragraph, Title } = Typography;

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [router, status]);

  return (
    <div className="app-shell">
      <Card className="auth-card">
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <Title level={2} style={{ marginBottom: 0 }}>
            Welcome to Qode Photo Demo
          </Title>
          <Paragraph style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
            Sign in with Google to upload photos, comment on them, and explore the end-to-end flow.
          </Paragraph>
          <Button
            icon={<GoogleCircleFilled />}
            type="primary"
            size="large"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            style={{ width: '100%', height: 46 }}
          >
            Continue with Google
          </Button>
          <Button
            icon={<LoginOutlined />}
            type="default"
            size="large"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            style={{ width: '100%', height: 46 }}
          >
            Demo Sign In
          </Button>
        </Space>
      </Card>
    </div>
  );
}
