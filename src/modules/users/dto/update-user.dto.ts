import { IsEmail, IsOptional, IsString, IsUrl, MinLength } from "class-validator";

export class UpdateUserDto {

  @IsOptional()
  @IsString()
  name!: string

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

}