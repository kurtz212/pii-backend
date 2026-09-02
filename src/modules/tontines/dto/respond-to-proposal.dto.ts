import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class RespondToProposalDto {
  @IsBoolean()
  accept!: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  requestedOrder?: number;
}