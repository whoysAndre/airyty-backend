import {
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @IsString()
  @MinLength(5)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsString()
  city!: string;

  @IsString()
  country!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxGuests!: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  pricePerNight!: number;
}
