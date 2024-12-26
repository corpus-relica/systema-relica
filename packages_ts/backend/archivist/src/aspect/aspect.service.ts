import { Injectable } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';
import { supertypes, qualificationsOfAspect } from 'src/graph/queries';

@Injectable()
export class AspectService {
  constructor(private readonly graphService: GraphService) {}

  postProcess(result) {
    return result.map((item) => {
      const obj = this.graphService.convertNeo4jInts(item.toObject().r);
      console.log(obj);
      return Object.assign({}, obj.properties);
    });
  }

  async execAndPostProcess(query, uid) {
    return this.postProcess(
      await this.graphService.execQuery(query, {
        uid,
      }),
    );
  }

  async getDefinition(uid) {
    // this is assuming the incoming uid is in fact an aspect uid
    // TODO: check if the uid is an aspect uid
    const supertypesRes = await this.execAndPostProcess(supertypes, uid);
    return supertypesRes;
  }

  async getQualifications(uid) {
    const qualifications = await this.execAndPostProcess(
      qualificationsOfAspect,
      uid,
    );
    return qualifications;
  }
}
