import { Injectable } from '@nestjs/common';
import { Fact } from '@relica/types';

@Injectable()
export class RawFactIngestionService {
    constructor() {}

    getHello(): string {
        return 'Hello World!';
    }

    ingestFact(fact: Fact): string {
        return 'Fact ingested!';
    }
}
