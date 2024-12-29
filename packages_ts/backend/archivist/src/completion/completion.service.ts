import { Injectable } from '@nestjs/common';
import { GraphService } from '../graph/graph.service.js';

@Injectable()
export class CompletionService {
  constructor(private readonly graphService: GraphService) {}

  async getLHObjectCompletion(rel_type_uid, rh_object_uid) {
    const lhObjectCompletionQuery = `
MATCH ()--(r)-->()
WHERE r.rel_type_uid = $rel_type_uid AND r.rh_object_uid = $rh_object_uid
RETURN r`;
    const result = await this.graphService.execQuery(lhObjectCompletionQuery, {
      rel_type_uid,
      rh_object_uid,
    });

    const returnFacts = result.map((item) => {
      return Object.assign(
        { rel_type_name: item.get('r').type },
        item.toObject().r.properties,
      );
    });

    return returnFacts;
  }

  async getRHObjectCompletion(lh_object_uid, rel_type_uid) {
    const rhObjectCompletionQuery = `
MATCH ()--(r)-->()
WHERE r.lh_object_uid = $lh_object_uid AND r.rel_type_uid = $rel_type_uid
RETURN r`;
    const result = await this.graphService.execQuery(rhObjectCompletionQuery, {
      lh_object_uid,
      rel_type_uid,
    });

    const returnFacts = result.map((item) => {
      return Object.assign(
        { rel_type_name: item.get('r').type },
        item.toObject().r.properties,
      );
    });

    return returnFacts;
  }
}
