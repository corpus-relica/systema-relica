import { ApiProperty } from '@nestjs/swagger';

export class QueryStringDto {
  @ApiProperty({
    description: 'The Gellish query string (can be multiline)',
    example: 'line 1\nline 2\nline 3',
  })
  queryString: string;
}
