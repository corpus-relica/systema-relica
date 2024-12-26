import { Injectable, Logger } from '@nestjs/common';
import { QueryService } from 'src/query/query.service';

@Injectable()
export class IndividualService {
  private readonly logger = new Logger(IndividualService.name);

  constructor(private readonly query: QueryService) {}

  async getAspectsClassifiedAs(uid: string, kindUID: string) {
    this.logger.log(`uid: ${uid}, kindUID: ${kindUID}`);
    const result = await this.query.interpretQueryString(
      `${uid} > 1727 > ?10.who\n?10.who > 1225 > ${kindUID}`,
      1,
      10,
    );
    return result.facts;
  }
}
