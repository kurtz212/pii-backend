import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, ArrayMinSize } from 'class-validator';

const PACKAGE_SIZES = ['petit', 'moyen', 'grand'];

export class CreateGroupedDeliveryDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'Une livraison groupée nécessite au moins 2 commandes' })
  @IsString({ each: true })
  orderIds!: string[];

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
