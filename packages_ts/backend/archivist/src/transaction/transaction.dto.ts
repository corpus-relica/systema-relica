import { ApiProperty } from '@nestjs/swagger';

export class startTransactionDto {
    @ApiProperty()
    machineName: string;
}

export class SendEventDto {
    @ApiProperty()
    event: any;
}
