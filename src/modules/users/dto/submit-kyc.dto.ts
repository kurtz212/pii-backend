import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const DOCUMENT_TYPES = ['cni', 'passeport', 'permis_conduire'];

export class SubmitKycDto {
  @IsIn(DOCUMENT_TYPES, {
    message: `Le type de document doit être l'un de : ${DOCUMENT_TYPES.join(', ')}`,
  })
  idDocumentType!: string;

  @IsString()
  @IsNotEmpty()
  idDocumentNumber!: string;
}