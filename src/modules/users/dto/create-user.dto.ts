import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @Matches(/^(\+226)?[0-9]{8}$/, {
    message: 'Numéro de téléphone invalide',
  })
  phone: string;

  @IsEmail({}, { message: 'Adresse email invalide' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;
}