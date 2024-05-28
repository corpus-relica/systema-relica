import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ValidationService } from './validation.service';

@Controller('validate')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Get('binaryFact')
  async binaryFact(@Query() query) {
    const result = await this.validationService.simpleValidateBinaryFact(query);
    return result;
  }

  @Post('binaryFacts')
  async binaryFacts(@Body() body: any) {
    const result = await Promise.all(
      body.map(async (fact) => {
        return await this.validationService.simpleValidateBinaryFact(fact);
      }),
    );
    return result;
  }
}
