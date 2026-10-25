import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty({ minLength: 3, maxLength: 50, example: 'MOBA Masters' })
  @IsString()
  @Length(3, 50)
  name!: string;

  @ApiProperty({ minLength: 10, maxLength: 200, example: 'Community for strategy and ranked discussions' })
  @IsString()
  @Length(10, 200)
  description!: string;

  @ApiProperty({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ownerId?: number;

  @ApiProperty({ type: [String], example: ['moba', 'ranked'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @Length(2, 20, { each: true })
  tags!: string[];

  @ApiPropertyOptional({ type: [Object], example: [{ id: 'general', name: 'general', type: 'Text', topic: 'General discussion' }], description: 'Channels created in the community wizard or settings' })
  @IsOptional()
  @IsArray()
  channels?: Array<string | { id?: string; name: string; type?: string; topic?: string }>;

  @ApiPropertyOptional({ example: '/uploads/1234-banner.png' })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  banner?: string;

  @ApiPropertyOptional({ example: '/uploads/1234-banner.png', description: 'Alias of banner kept for frontend compatibility' })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  bannerImage?: string;

  @ApiPropertyOptional({ enum: ['public', 'private'], example: 'public' })
  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: 'public' | 'private';

  @ApiPropertyOptional({ type: [String], example: ['Be respectful', 'Stay on topic'], description: 'Owner-editable community rules — the UI falls back to generic defaults when this is empty' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rules?: string[];

  @ApiPropertyOptional({ example: '⚡', description: 'Emoji or image URL shown as the community icon' })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  icon?: string;

  @ApiPropertyOptional({ example: 'Gaming' })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  category?: string;

  @ApiPropertyOptional({ example: 'moba-masters' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  slug?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  memberCount?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  onlineCount?: number;
}
