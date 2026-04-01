import { Type } from 'class-transformer';
import { IsDate, IsInt, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  listingId!: string;

  @IsDate()
  @Type(() => Date)
  checkIn!: Date;

  @IsDate()
  @Type(() => Date)
  checkOut!: Date;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  guestCount!: number;
}
