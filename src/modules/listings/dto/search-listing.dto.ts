import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchListingDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  guests?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
