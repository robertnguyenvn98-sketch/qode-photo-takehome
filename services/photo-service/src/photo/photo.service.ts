import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginationDto } from './dto/pagination.dto';
import { AuthenticatedUser } from './types';
import { UsersClientService } from './users-client.service';

@Injectable()
export class PhotoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly usersClientService: UsersClientService,
  ) {}

  async createPhoto(user: AuthenticatedUser, file: Express.Multer.File) {
    const uploaded = await this.cloudinaryService.uploadImage(file);

    try {
      const photo = await this.prisma.photo.create({
        data: {
          userId: user.sub,
          publicId: uploaded.publicId,
          secureUrl: uploaded.secureUrl,
          format: uploaded.format,
          bytes: uploaded.bytes,
          width: uploaded.width,
          height: uploaded.height,
        },
      });

      return {
        ...photo,
        thumbnailUrl: this.cloudinaryService.buildThumbnailUrl(photo.publicId),
      };
    } catch (error) {
      await this.cloudinaryService.deleteImage(uploaded.publicId);
      throw error;
    }
  }

  async listPhotos(pagination: PaginationDto) {
    const skip = (pagination.page - 1) * pagination.pageSize;

    const [items, total] = await Promise.all([
      this.prisma.photo.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.pageSize,
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      }),
      this.prisma.photo.count(),
    ]);

    const userIds = Array.from(new Set(items.map((item) => item.userId)));
    const uploaderEntries = await Promise.all(
      userIds.map(async (userId) => {
        const summary = await this.usersClientService.getUploaderSummary(userId);
        return [userId, summary] as const;
      }),
    );
    const uploaderMap = new Map(uploaderEntries);

    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      items: items.map((item) => ({
        ...item,
        thumbnailUrl: this.cloudinaryService.buildThumbnailUrl(item.publicId),
        uploader: uploaderMap.get(item.userId) ?? {
          id: item.userId,
          name: null,
          avatarUrl: null,
        },
        latestComments: item.comments,
      })),
    };
  }

  async createComment(
    user: AuthenticatedUser,
    photoId: string,
    dto: CreateCommentDto,
  ) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return this.prisma.comment.create({
      data: {
        photoId,
        userId: user.sub,
        content: dto.content,
      },
    });
  }

  async listComments(photoId: string, pagination: PaginationDto) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const skip = (pagination.page - 1) * pagination.pageSize;
    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { photoId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pagination.pageSize,
      }),
      this.prisma.comment.count({ where: { photoId } }),
    ]);

    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      items,
    };
  }

  async deletePhoto(user: AuthenticatedUser, photoId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (user.role !== 'ADMIN' && photo.userId !== user.sub) {
      throw new ForbiddenException('You are not allowed to delete this photo');
    }

    await this.prisma.photo.delete({ where: { id: photoId } });
    await this.cloudinaryService.deleteImage(photo.publicId);

    return { success: true };
  }

  async deleteComment(user: AuthenticatedUser, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (user.role !== 'ADMIN' && comment.userId !== user.sub) {
      throw new ForbiddenException('You are not allowed to delete this comment');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }
}
