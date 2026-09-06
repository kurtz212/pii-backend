import { IsIn, IsOptional, IsString } from 'class-validator';

const TRACKING_STEPS = ['picked_up', 'in_transit', 'customs', 'delivered'];

export class AddQuoteTrackingStepDto {
  @IsIn(TRACKING_STEPS, { message: `Étape invalide : ${TRACKING_STEPS.join(', ')}` })
  step!: string;

  @IsString()
  @IsOptional()
  note?: string;
}