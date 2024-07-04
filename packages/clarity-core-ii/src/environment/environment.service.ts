import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvFact } from './envFact.entity';
import { EnvModel } from './envModel.entity';
import { EnvSelectedEntity } from './envSelectedEntity.entity';
import { Fact } from '@relica/types';
import { EntityFactEnum } from './envSelectedEntity.entity';
import { ModelService } from '../model/model.service';

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);

  constructor(
    @InjectRepository(EnvFact)
    private readonly envFactRepository: Repository<EnvFact>,
    @InjectRepository(EnvModel)
    private readonly envModelRepository: Repository<EnvModel>,
    @InjectRepository(EnvSelectedEntity)
    private readonly envSelectedEntityRepository: Repository<EnvSelectedEntity>,
    private readonly modelService: ModelService,
  ) {}

  async modelsFromFacts(facts: Fact[]) {
    // const entityUIDs = facts.reduce((acc: number[], fact: Fact) => {
    //   if (!acc.includes(fact.lh_object_uid)) acc.push(fact.lh_object_uid);
    //   if (!acc.includes(fact.rh_object_uid)) acc.push(fact.rh_object_uid);
    //   return acc;
    // }, []);
    // const models = (await this.modelService.retrieveModels(entityUIDs)).filter(
    //   (model: any) => model !== null,
    // );
    // return models;
  }

  async retrieveEnvironment(envID: string) {
    console.log('!!!!! RETREIVE ENVIRONMENT!!!!');

    const models = await this.envModelRepository.find();
    const facts = await this.envFactRepository.find();
    const selectedEntity = await this.envSelectedEntityRepository.find();

    console.log(
      '--------------------------------------------------------------------',
    );
    console.log('selectedEntity', selectedEntity);

    return {
      models: models.map((row: any) => row.model),
      facts: facts.map((row: any) => row.fact),
      selectedEntity: selectedEntity[0].uid,
    };
  }

  async insertFacts(facts: Fact[]) {
    for (const fact of facts) {
      //   const res = await pgClient.query(
      //     'INSERT INTO env_fact (uid, fact) VALUES ($1, $2)',
      //     [fact.fact_uid, fact],
      //   );
      const newFact = new EnvFact();
      newFact.uid = fact.fact_uid;
      newFact.fact = fact;
      await this.envFactRepository.save(newFact);
    }
  }

  async insertModels(models: any[]) {
    for (const model of models) {
      //   const res = await pgClient.query(
      //     'INSERT INTO env_model (uid, model) VALUES ($1, $2)',
      //     [model.uid, model],
      //   );
      const newModel = new EnvModel();
      newModel.uid = model.uid;
      newModel.model = model;
      await this.envModelRepository.save(newModel);
    }
  }

  async removeModels(uids: number[]) {
    // const res = await pgClient.query(
    //   'DELETE FROM env_model WHERE uid = ANY($1::int[])',
    //   [uids],
    // );
  }

  async removeFacts(uids: number[]) {
    // const res = await pgClient.query(
    //   'DELETE FROM env_fact WHERE uid = ANY($1::int[])',
    //   [uids],
    // );
  }

  async clearEnvironment() {
    // const res = await pgClient.query('DELETE FROM env_model');
    // const res2 = await pgClient.query('DELETE FROM env_fact');
    // const res3 = await pgClient.query(
    //   'UPDATE env_selected_entity SET uid = NULL WHERE id = 1',
    // );
    // return;
  }

  async setSelectedEntity(uid: number | null, type: string | null = null) {
    if (uid === null) {
      return await this.envSelectedEntityRepository.update(1, {
        uid: null,
        type: EntityFactEnum.NONE,
      });
    }
    if (type === 'entity') {
      // only if uid exists as lh_object_uid or rh_object_uid in env_fact
      // env_fact schema is (uid, fact) where fact is a json object
      // const res = await pgClient.query(
      //   "SELECT * FROM env_fact WHERE fact->>'lh_object_uid' = $1 OR fact->>'rh_object_uid' = $1",
      //   [uid],
      // );
      const res = await this.envFactRepository
        .createQueryBuilder('fact')
        .where("fact.fact->>'lh_object_uid' = :uid", { uid })
        .orWhere("fact.fact->>'rh_object_uid' = :uid", { uid })
        .getMany();

      console.log('res', res);
      if (res.length === 0) {
        return;
      }

      // needs to insert into first row
      // return await pgClient.query(
      //   "UPDATE env_selected_entity SET uid = $1, type = 'entity' WHERE id = 1",
      //   [uid],
      // );
      return await this.envSelectedEntityRepository.update(1, {
        uid: uid + '',
        type: EntityFactEnum.ENTITY,
      });
    } else if (type === 'fact') {
      //   // only if uid exists as lh_object_uid or rh_object_uid in env_fact
      //   // env_fact schema is (uid, fact) where fact is a json object
      //   const res = await pgClient.query(
      //     "SELECT * FROM env_fact WHERE fact->>'fact_uid' = $1",
      //     [uid],
      //   );
      const res = await this.envFactRepository
        .createQueryBuilder('fact')
        .where("fact.fact->>'fact_uid' = :uid", { uid })
        .getMany();

      if (res.length === 0) {
        return;
      }
      //   // needs to insert into first row
      //   return await pgClient.query(
      //     "UPDATE env_selected_entity SET uid = $1, type = 'fact' WHERE id = 1",
      //     [uid],
      //   );
      return await this.envSelectedEntityRepository.update(1, {
        uid: uid + '',
        type: EntityFactEnum.FACT,
      });
    }
  }

  async getSelectedEntity() {
    // const res = await pgClient.query('SELECT * FROM env_selected_entity');
    // return res.rows[0].uid;
  }

  //

  async getSpecializationHierarchy(uid: number) {
    // const result = await gsh(uid);
    // const facts = result.facts;
    // const models = await modelsFromFacts(facts);
    // es.insertFacts(facts);
    // es.insertModels(models);
    // const payload = { facts, models };
    // socketServer.emit('system', 'addFacts', payload);
    // return payload;
  }

  async getSpecializationFactByUID(uid: number) {
    // const result = await getSpecializationFact(uid);
    // const models = await modelsFromFacts(result);
    // es.insertFacts(result);
    // es.insertModels(models);
    // const payload = { facts: result, models };
    // socketServer.emit('system', 'addFacts', payload);
    // return payload;
  }

  async loadEntityBase(uid: number) {
    // if (uid === undefined) return { facts: [], models: [] };
    // const selectedEntity = await es.getSelectedEntity();
    // const defResult = await getDefinitiveFacts(uid);
    // const relResult = await getFactsRelatingEntities(uid, selectedEntity);
    // console.log('loadEntity', selectedEntity, uid, defResult, relResult);
    // console.log('loadEntity', typeof defResult, typeof relResult);
    // const result = defResult.concat(relResult);
    // const models = await modelsFromFacts(result);
    // es.insertFacts(result);
    // es.insertModels(models);
    // const payload = { facts: result, models };
    // return payload;
  }

  async loadEntity(uid: number) {
    // const payload = await loadEntityBase(uid);
    // socketServer.emit('system', 'addFacts', payload);
    // return payload;
  }

  async loadEntities(uids: number[]) {
    // let facts: Fact[] = [];
    // let models: any[] = [];
    // for (let i = 0; i < uids.length; i++) {
    //   const payload = await loadEntityBase(uids[i]);
    //   facts = facts.concat(payload.facts);
    //   models = models.concat(payload.models);
    // }
    // const payload = { facts, models };
    // socketServer.emit('system', 'addFacts', payload);
    // return payload;
  }

  async removeEntity(uid: number) {
    // console.log('remove entity', uid);
    // const env = await es.retrieveEnvironment();
    // const facts = env.facts;
    // let factsToRemove: Fact[] = [];
    // let remainingFacts: Fact[] = [];
    // facts.forEach((fact: Fact) => {
    //   if (fact.lh_object_uid === uid || fact.rh_object_uid === uid) {
    //     factsToRemove.push(fact);
    //   } else {
    //     remainingFacts.push(fact);
    //   }
    // });
    // let factUIDsToRemove: number[] = [];
    // let candidateModelUIDsToRemove: Set<number> = new Set();
    // factsToRemove.forEach((fact: Fact) => {
    //   factUIDsToRemove.push(fact.fact_uid);
    //   candidateModelUIDsToRemove.add(fact.lh_object_uid);
    //   candidateModelUIDsToRemove.add(fact.rh_object_uid);
    // });
    // remainingFacts.forEach((fact: Fact) => {
    //   if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
    //     candidateModelUIDsToRemove.delete(fact.lh_object_uid);
    //   }
    //   if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
    //     candidateModelUIDsToRemove.delete(fact.rh_object_uid);
    //   }
    // });
    // es.removeFacts(factUIDsToRemove);
    // es.removeModels(Array.from(candidateModelUIDsToRemove));
    // socketServer.emit('system', 'remFacts', { fact_uids: factUIDsToRemove });
  }

  async removeFact(uid: number) {
    // console.log('remove fact', uid);
    // const env = await es.retrieveEnvironment();
    // const facts = env.facts;
    // const factToRemove = facts.find((fact: Fact) => fact.fact_uid === uid);
    // let candidateModelUIDsToRemove: Set<number> = new Set([
    //   factToRemove.lh_object_uid,
    //   factToRemove.rh_object_uid,
    // ]);
    // facts.forEach((fact: Fact) => {
    //   if (fact.fact_uid !== uid) {
    //     if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
    //       candidateModelUIDsToRemove.delete(fact.lh_object_uid);
    //     }
    //     if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
    //       candidateModelUIDsToRemove.delete(fact.rh_object_uid);
    //     }
    //   }
    // });
    // es.removeFacts([uid]);
    // es.removeModels(Array.from(candidateModelUIDsToRemove));
    // socketServer.emit('system', 'remFacts', { fact_uids: [uid] });
  }

  async clearEntities() {
    // await es.clearEnvironment();
    // socketServer.emit('system', 'entitiesCleared', {});
  }

  async removeEntities(uids: number[]) {
    // for (let i = 0; i < uids.length; i++) {
    //   removeEntity(uids[i]);
    // }
  }

  async removeEntityDescendants(uid: number) {
    // console.log('>// REMOVE ENTITY DESCENDANTS');
    // const env = await es.retrieveEnvironment();
    // const facts = env.facts;
    // let factsToRemove: Fact[] = [];
    // let remainingFacts: Fact[] = [];
    // facts.forEach((fact: Fact) => {
    //   if (/* fact.lh_object_uid === uid || */ fact.rh_object_uid === uid) {
    //     factsToRemove.push(fact);
    //   } else {
    //     remainingFacts.push(fact);
    //   }
    // });
    // let factUIDsToRemove: number[] = [];
    // let candidateModelUIDsToRemove: Set<number> = new Set();
    // factsToRemove.forEach((fact: Fact) => {
    //   factUIDsToRemove.push(fact.fact_uid);
    //   candidateModelUIDsToRemove.add(fact.lh_object_uid);
    //   candidateModelUIDsToRemove.add(fact.rh_object_uid);
    // });
    // remainingFacts.forEach((fact: Fact) => {
    //   if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
    //     candidateModelUIDsToRemove.delete(fact.lh_object_uid);
    //   }
    //   if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
    //     candidateModelUIDsToRemove.delete(fact.rh_object_uid);
    //   }
    // });
    // es.removeFacts(factUIDsToRemove);
    // es.removeModels(Array.from(candidateModelUIDsToRemove));
    // socketServer.emit('system', 'remFacts', { fact_uids: factUIDsToRemove });
    // const subtypingFacts = factsToRemove.filter(
    //   (fact: Fact) => fact.rel_type_uid === 1146 && fact.rh_object_uid === uid,
    // );
    // console.log('SUBTYPING FACTS: ', subtypingFacts);
    // subtypingFacts.forEach((fact: Fact) => {
    //   console.log('>>> RECURSE ON: ', fact.lh_object_uid);
    //   removeEntityDescendants(fact.lh_object_uid);
    // });
  }

  async getSubtypes(uid: number) {
    // const result = await gst(uid);
    // const models = await modelsFromFacts(result);
    // es.insertFacts(result);
    // es.insertModels(models);
    // const payload = { facts: result, models };
    // socketServer.emit('system', 'addFacts', payload);
    // return payload;
  }

  async getSubtypesCone(uid: number) {
    // const result = await gstc(uid);
    // const models = await modelsFromFacts(result);
    // es.insertFacts(result);
    // es.insertModels(models);
    // const payload = { facts: result, models };
    // socketServer.emit('system', 'addFacts', payload);
    // return payload;
  }

  async listSubtypes(uid: number) {
    // const result = await gst(uid);
    // const models = await modelsFromFacts(result);
    // const payload = { facts: result, models };
    // return payload;
  }

  async getAllRelatedFacts(uid: number) {
    // const result = await retrieveAllFacts(uid);
    // const models = await modelsFromFacts(result);
    // await es.insertFacts(result);
    // await es.insertModels(models);
    // socketServer.emit('system', 'addFacts', { facts: result, models });
    // return { facts: result, models };
  }

  // THIS PROBABLY DOESN"T BELONG HERE!!
  // like, weigh the meritts of routing all such calls through CC vs. giving NOUS and Integrator direct access to the DB layer
  async textSearch(searchTerm: string) {
    // const selectedEntity = await es.getSelectedEntity();
    // const searchResult: any = await textSearchExact(searchTerm);
    // if (searchResult.facts.length === 0) return { facts: [], models: [] };
    // const relResult = await getFactsRelatingEntities(
    //   searchResult.facts[0].lh_object_uid,
    //   selectedEntity,
    // );
    // const facts = searchResult.facts.concat(relResult);
    // // console.log(Object.entries(result));
    // // console.log(result.facts);
    // const models = await modelsFromFacts(facts);
    // es.insertFacts(facts);
    // es.insertModels(models);
    // socketServer.emit('system', 'addFacts', { facts, models });
    // return { facts: facts, models };
  }

  async specializeKind(uid: number, supertypeName: string, name: string) {
    // const result = await createKind(uid, supertypeName, name, 'this is a test');
    // //refresh the category-descendants cache on client-side
    // socketServer.emit('system', 'updateCategoryDescendantsCache', {});
    // if (result.success) {
    //   const { fact } = result;
    //   const facts = [fact];
    //   const models = await modelsFromFacts(facts);
    //   es.insertFacts(facts);
    //   es.insertModels(models);
    //   socketServer.emit('system', 'addFacts', { facts, models });
    //   return { success: true, uid: fact.lh_object_uid };
    // }
    // return { error: 'failed to specialize kind' };
    // console.log('specialized Kind', result);
  }

  async classifyIndividual(uid: number, typeName: string, name: string) {
    // const result = await createIndividual(
    //   uid,
    //   typeName,
    //   name,
    //   'this is a test',
    // );
    // //refresh the category-descendants cache on client-side
    // socketServer.emit('system', 'updateCategoryDescendantsCache', {});
    // if (result.success) {
    //   const { fact } = result;
    //   const facts = [fact];
    //   const models = await modelsFromFacts(facts);
    //   es.insertFacts(facts);
    //   es.insertModels(models);
    //   socketServer.emit('system', 'addFacts', { facts, models });
    //   return { success: true, uid: fact.lh_object_uid };
    // }
    // return { error: 'failed to classify individual' };
    // console.log('classified Individual', result);
  }

  async getClassified(uid: number) {
    // const result = await gc(uid);
    // const facts = result;
    // const models = await modelsFromFacts(facts);
    // es.insertFacts(facts);
    // es.insertModels(models);
    // socketServer.emit('system', 'addFacts', { facts, models });
    // return { success: true, facts, models };
  }

  async getClassificationFactByUID(uid: number) {
    // const result = await getClassificationFact(uid);
    // const models = await modelsFromFacts(result);
    // es.insertFacts(result);
    // es.insertModels(models);
    // const payload = { facts: result, models };
    // socketServer.emit('system', 'addFacts', payload);
    // return payload;
  }
}
