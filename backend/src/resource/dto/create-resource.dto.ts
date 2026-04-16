import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateResourceDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title!: string;


    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;
}
