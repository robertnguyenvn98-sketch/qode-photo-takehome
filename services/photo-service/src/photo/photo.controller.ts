import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PhotoService } from './photo.service';
import { AuthenticatedUser } from './types';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Controller()
@UseGuards(JwtAuthGuard)
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(new BadRequestException('Unsupported file type'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadPhoto(
    @Req() request: Request & { user?: AuthenticatedUser },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    return this.photoService.createPhoto(request.user as AuthenticatedUser, file);
  }

  @Get('photos')
  listPhotos(@Query() pagination: PaginationDto) {
    return this.photoService.listPhotos(pagination);
  }

  @Post('photos/:photoId/comments')
  createComment(
    @Req() request: Request & { user?: AuthenticatedUser },
    @Param('photoId', new ParseUUIDPipe()) photoId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.photoService.createComment(request.user as AuthenticatedUser, photoId, dto);
  }

  @Get('photos/:photoId/comments')
  listComments(
    @Param('photoId', new ParseUUIDPipe()) photoId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.photoService.listComments(photoId, pagination);
  }

  @Delete('photos/:photoId')
  deletePhoto(
    @Req() request: Request & { user?: AuthenticatedUser },
    @Param('photoId', new ParseUUIDPipe()) photoId: string,
  ) {
    return this.photoService.deletePhoto(request.user as AuthenticatedUser, photoId);
  }

  @Delete('comments/:id')
  deleteComment(
    @Req() request: Request & { user?: AuthenticatedUser },
    @Param('id', new ParseUUIDPipe()) commentId: string,
  ) {
    return this.photoService.deleteComment(request.user as AuthenticatedUser, commentId);
  }
}
