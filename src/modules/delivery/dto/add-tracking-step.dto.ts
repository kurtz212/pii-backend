import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const TRACKING_STEPS = ['picked_up', 'in_transit', 'delivered'];

export class AddTrackingStepDto {
  @IsIn(TRACKING_STEPS, { message: `Étape invalide : ${TRACKING_STEPS.join(', ')}` })
  step!: string;

  @IsString()
  @IsOptional()
  note?: string;
}