// import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCollectionDto {
  @ApiProperty({ description: 'Fact UID' })
  // @IsInt()
  fact_uid: number;

  @ApiProperty({ description: 'Collection UID' })
  // @IsInt()
  collection_uid: number;

  @ApiProperty({ description: 'Collection Name' })
  // @IsString()
  collection_name: string;
}

export class CreateDateDto {
  @ApiProperty({ description: 'Date UID' })
  // @IsInt()
  date_uid: number;

  @ApiProperty({ description: 'Collection UID' })
  // @IsInt()
  collection_uid: number;

  @ApiProperty({ description: 'Collection Name' })
  // @IsString()
  collection_name: string;
}
