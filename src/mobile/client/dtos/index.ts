import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GENDER } from '../../../common/constants/gender.constant';

export class CreateClientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  countryCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])/gm, {
    message:
      'Password must be between 6 and 64 characters long with 1 special character and capital character each',
  })
  @MinLength(6)
  @MaxLength(64)
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsEnum(GENDER)
  @IsOptional()
  gender: string;

  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsOptional()
  dateOfBirth: Date;
}

export class UpdateClientDto extends PartialType(CreateClientDto) { }
