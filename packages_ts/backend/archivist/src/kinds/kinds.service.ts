import neo4j from 'neo4j-driver';

import { Injectable, Logger } from '@nestjs/common';

import { GraphService } from '../graph/graph.service.js';

import { getListOfKindsQuery, countKindsQuery } from '../graph/queries.js';

@Injectable()
export class KindsService {
  private readonly logger = new Logger(KindsService.name);

  constructor(private readonly graphService: GraphService) {}

  async getList(
    sortField: string,
    sortOrder: string,
    skip: number,
    pageSize: number,
  ) {
    const result = await this.graphService.execQuery(getListOfKindsQuery, {
      sortField,
      sortOrder,
      skip: neo4j.int(skip),
      pageSize: neo4j.int(pageSize),
    });

    const total = await this.graphService.execQuery(countKindsQuery, {});

    const transformedResult = result.map((item) => {
      const t: any = this.graphService.transformResult(item);
      t.id = t.fact_uid;
      return t;
    });

    //convert neo4j integer to js number
    console.log();

    return {
      data: transformedResult,
      total: total[0].get('total').toInt(),
    };
  }

  async getOne(id: number) {
    return {};
  }

  async getMany(data: any) {}

  async getManyReference(data: any) {}

  async create(data: any) {}

  async update(id: number, data: any) {}

  async updateMany(data: any) {}

  async delete(id: number) {}

  async deleteMany(data: any) {}
}
