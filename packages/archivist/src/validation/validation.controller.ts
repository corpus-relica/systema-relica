import { Controller, Get, Query } from '@nestjs/common';
import { ValidationService } from './validation.service';

@Controller('validate')
export class ValidationController {
    constructor(private readonly validationService: ValidationService) {}

    @Get('binaryFact')
    async binaryFact(@Query() query) {
        const result =
            await this.validationService.simpleValidateBinaryFact(query);
        return result;
    }
}
