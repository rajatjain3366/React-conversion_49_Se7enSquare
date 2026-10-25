import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength, IsBoolean, IsIn, IsEmail, Matches, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class PrivacyDto {
  @ValidateIf((_, value) => value !== undefined) @IsIn(['public', 'members', 'private']) profileVisibility?: 'public' | 'members' | 'private';
  @ValidateIf((_, value) => value !== undefined) @IsIn(['everyone', 'members', 'nobody']) whoCanMessage?: 'everyone' | 'members' | 'nobody';
  @ValidateIf((_, value) => value !== undefined) @IsBoolean() showEmail?: boolean;
  @ValidateIf((_, value) => value !== undefined) @IsBoolean() showPhone?: boolean;
  @ValidateIf((_, value) => value !== undefined) @IsBoolean() showActivity?: boolean;
  @ValidateIf((_, value) => value !== undefined) @IsBoolean() appearInSearch?: boolean;
}


export class UpdateProfileDto {
  @ValidateIf((_, value) => value !== undefined) @IsString() @Length(3, 30) @Matches(/^[A-Za-z0-9_]+$/)
  username?: string;

  @ValidateIf((_, value) => value !== undefined) @IsEmail() @MaxLength(254)
  email?: string;

  @ValidateIf((_, value) => value !== undefined) @ValidateNested() @Type(() => PrivacyDto)
  privacy?: PrivacyDto;

  @ApiPropertyOptional({ example: 'Alex' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Morgan' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ minLength: 5, maxLength: 160, example: 'Loves MMORPG and FPS.' })
  @ValidateIf((_, value) => value !== undefined && value !== '' && value !== null)
  @IsString()
  @Length(5, 160)
  bio?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @ValidateIf((_, value) => value !== undefined && value !== '' && value !== null)
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: '/uploads/1234-avatar.png' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  avatar?: string | null;
}
