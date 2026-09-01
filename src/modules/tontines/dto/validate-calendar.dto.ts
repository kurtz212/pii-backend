import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ValidateCalendarDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'Une tontine nécessite au moins 2 participants' })
  @IsString({ each: true })
  orderedUserIds!: string[];
}