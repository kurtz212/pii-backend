import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const PACKAGE_SIZES = ['petit', 'moyen', 'grand'];

export class CreateDeliveryRequestDto {
  @IsString()
  @IsNotEmpty()
  depart!: string;

  @IsString()
  @IsNotEmpty()
  destination!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsIn(PACKAGE_SIZES, { message: `La taille doit être : ${PACKAGE_SIZES.join(', ')}` })
  @IsOptional()
  packageSize?: string;

  @IsBoolean()
  @IsOptional()
  isFragile?: boolean;
}