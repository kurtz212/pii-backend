import { IsEnum } from 'class-validator';
import { ContributionStatus } from '../tontine.enums';

export class UpdateContributionDto {
  @IsEnum(ContributionStatus, { message: 'Statut invalide' })
  status!: ContributionStatus;
}