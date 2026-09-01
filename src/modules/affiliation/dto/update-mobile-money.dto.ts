import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const OPERATEURS_FICTIFS = ['moov_money', 'orange_money', 'wave'];

export class UpdateMobileMoneyDto {
  @IsIn(OPERATEURS_FICTIFS, {
    message: `L'opérateur doit être l'un de : ${OPERATEURS_FICTIFS.join(', ')}`,
  })
  operator!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;
}