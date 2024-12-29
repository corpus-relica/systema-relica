import { Injectable } from '@nestjs/common';
import { GraphService } from '../graph/graph.service.js';
import {
  supertypes,
  synonyms,
  inverses,
  intrinsicAspectsDef,
  qualitativeAspectsDef,
  intendedFunctionsDef,
  partsDef,
  collectionsDef,
} from '../graph/queries.js';

@Injectable()
export class DefinitionService {
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
    const supertypesRes = await this.execAndPostProcess(supertypes, uid);
    const synonymsRes = await this.execAndPostProcess(synonyms, uid);
    const inversesRes = await this.execAndPostProcess(inverses, uid);
    const intrinsicAspectsRes = await this.execAndPostProcess(
      intrinsicAspectsDef,
      uid,
    );
    const qualitativeAspectsRes = await this.execAndPostProcess(
      qualitativeAspectsDef,
      uid,
    );
    const intendedFunctionsRes = await this.execAndPostProcess(
      intendedFunctionsDef,
      uid,
    );
    //
    //
    const partsRes = await this.execAndPostProcess(partsDef, uid);
    const collectionsRes = await this.execAndPostProcess(collectionsDef, uid);

    return {
      supertypes: supertypesRes,
      aliases: {
        synonyms: synonymsRes,
        inverses: inversesRes,
      },
      intrinsicAspects: intrinsicAspectsRes,
      qualitativeAspects: qualitativeAspectsRes,
      intendedFunctions: intendedFunctionsRes,
      pictures: {}, // TODO
      information: {}, // TODO
      parts: partsRes,
      collections: collectionsRes,
    };
  }
}
