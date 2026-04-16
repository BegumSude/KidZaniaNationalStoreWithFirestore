import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateResourceDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    title?: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;
}
