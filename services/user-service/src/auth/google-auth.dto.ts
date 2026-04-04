import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum OAuthProvider {
  GOOGLE = 'google',
  EMAIL_OTP = 'email_otp',
}

export class SyncOAuthDto {
  @IsEnum(OAuthProvider)
  provider!: OAuthProvider;

  @IsString()
  @IsNotEmpty()
  providerUserId!: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string | null;
}
