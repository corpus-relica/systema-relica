import { ApiProperty } from '@nestjs/swagger';

export class ExecCommandDto {
  @ApiProperty({
    description: 'The command to execute. Can be multiple lines.',
    example: 'print("Hello, World!")\nfor i in range(5):\n    print(i)',
    type: 'string',
    format: 'text',
  })
  command: string;
}
