import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsIn(['google'])
  provider!: 'google';

  @IsString()
  @IsNotEmpty()
  providerUserId!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
