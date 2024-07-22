import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvFact } from './envFact.entity';
import { EnvModel } from './envModel.entity';
import { EnvSelectedEntity } from './envSelectedEntity.entity';
import { Fact } from '@relica/types';
import { EntityFactEnum } from './envSelectedEntity.entity';
import { ModelService } from '../model/model.service';
import { ArchivistService } from '../archivist/archivist.service';

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
    private readonly archivistService: ArchivistService,
  ) {}

  async modelsFromFacts(facts: Fact[]) {
    console.log('!!!!! MODELS FROM FACTS!!!!');
    console.log(facts);
    const entityUIDs = facts.reduce((acc: number[], fact: Fact) => {
      if (!acc.includes(fact.lh_object_uid)) acc.push(fact.lh_object_uid);
      if (!acc.includes(fact.rh_object_uid)) acc.push(fact.rh_object_uid);
      return acc;
    }, []);
    const models = (await this.modelService.retrieveModels(entityUIDs)).filter(
      (model: any) => model !== null,
    );
    return models;
  }

  async retrieveEnvironment(envID?: string) {
    console.log('!!!!! RETREIVE ENVIRONMENT!!!!');

    const models = await this.envModelRepository.find();
    const facts = await this.envFactRepository.find();
    const selectedEntity = await this.envSelectedEntityRepository.find();

    console.log(
      '--------------------------------------------------------------------',
    );
    console.log('selectedEntity', selectedEntity);

    const selectedEntityUID = selectedEntity[0] ? selectedEntity[0].uid : null;

    return {
      models: models.map((row: any) => row.model),
      facts: facts.map((row: any) => row.fact),
      selectedEntity: selectedEntityUID,
    };
  }

  async insertFacts(facts: Fact[]) {
    for (const fact of facts) {
      const newFact = new EnvFact();
      newFact.uid = fact.fact_uid;
      newFact.fact = fact;
      await this.envFactRepository.insert(newFact);
    }
  }

  async insertModels(models: any[]) {
    for (const model of models) {
      const newModel = new EnvModel();
      newModel.uid = model.uid;
      newModel.model = model;
      await this.envModelRepository.save(newModel);
    }
  }

  async removeModels(uids: number[]) {
    if (uids.length === 0) return;
    await this.envModelRepository.delete(uids);
  }

  async clearEnvironment() {
    await this.envModelRepository.delete({});
    await this.envFactRepository.delete({});
    await this.envSelectedEntityRepository.update(1, {
      uid: null,
      type: EntityFactEnum.NONE,
    });
    return;
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
      // needs to insert into first row
      return await this.envSelectedEntityRepository.update(1, {
        uid: uid + '',
        type: EntityFactEnum.FACT,
      });
    }
  }

  async getSelectedEntity() {
    const res = await this.envSelectedEntityRepository.find();
    if (res.length === 0) {
      return null;
    }
    return res[0].uid;
  }

  //

  async getSpecializationHierarchy(uid: number) {
    const result = await this.archivistService.getSpecializationHierarchy(uid);
    const facts = result.facts;
    const models = await this.modelsFromFacts(facts);
    this.insertFacts(facts);
    this.insertModels(models);
    const payload = { facts, models };
    // socketServer.emit('system', 'addFacts', payload);
    return payload;
  }

  async getSpecializationFactByUID(uid: number) {
    const result = await this.archivistService.getSpecializationFact(uid);
    const models = await this.modelsFromFacts(result);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };
    // socketServer.emit('system', 'addFacts', payload);
    return payload;
  }

  async loadEntityBase(uid: number) {
    if (uid === undefined) return { facts: [], models: [] };
    const selectedEntity = await this.getSelectedEntity();
    const defResult = await this.archivistService.getDefinitiveFacts(uid);
    const relResult = await this.archivistService.getFactsRelatingEntities(
      uid,
      +selectedEntity,
    );
    const result = defResult.concat(relResult);
    const models = await this.modelsFromFacts(result);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };
    return payload;
  }

  async loadEntity(uid: number) {
    const payload = await this.loadEntityBase(uid);
    return payload;
  }

  async removeEntity(uid: number) {
    console.log('remove entity', uid);
    const env = await this.retrieveEnvironment();
    const facts = env.facts;
    let factsToRemove: Fact[] = [];
    let remainingFacts: Fact[] = [];
    facts.forEach((fact: Fact) => {
      if (fact.lh_object_uid === uid || fact.rh_object_uid === uid) {
        factsToRemove.push(fact);
      } else {
        remainingFacts.push(fact);
      }
    });
    let factUIDsToRemove: number[] = [];
    let candidateModelUIDsToRemove: Set<number> = new Set();
    factsToRemove.forEach((fact: Fact) => {
      factUIDsToRemove.push(fact.fact_uid);
      candidateModelUIDsToRemove.add(fact.lh_object_uid);
      candidateModelUIDsToRemove.add(fact.rh_object_uid);
    });
    remainingFacts.forEach((fact: Fact) => {
      if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
        candidateModelUIDsToRemove.delete(fact.lh_object_uid);
      }
      if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
        candidateModelUIDsToRemove.delete(fact.rh_object_uid);
      }
    });
    if (factUIDsToRemove.length > 0) this.removeFacts(factUIDsToRemove);
    if (candidateModelUIDsToRemove.size > 0)
      this.removeModels(Array.from(candidateModelUIDsToRemove));
    return factUIDsToRemove;
  }

  async removeFact(uid: number) {
    console.log('remove fact', uid);
    const env = await this.retrieveEnvironment();
    const facts = env.facts;
    const factToRemove = facts.find((fact: Fact) => fact.fact_uid === uid);
    let candidateModelUIDsToRemove: Set<number> = new Set([
      factToRemove.lh_object_uid,
      factToRemove.rh_object_uid,
    ]);
    facts.forEach((fact: Fact) => {
      if (fact.fact_uid !== uid) {
        if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
          candidateModelUIDsToRemove.delete(fact.lh_object_uid);
        }
        if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
          candidateModelUIDsToRemove.delete(fact.rh_object_uid);
        }
      }
    });
    this.removeFacts([uid]);
    if (candidateModelUIDsToRemove.size > 0)
      this.removeModels(Array.from(candidateModelUIDsToRemove));
  }

  async removeFacts(uids: number[]) {
    console.log('remove facts', uids);
    if (uids.length === 0) return;
    await this.envFactRepository.delete(uids);
  }

  async clearEntities() {
    this.clearEnvironment();
  }

  async removeEntities(uids: number[]) {
    const removedFactUids = [];
    await Promise.all(
      uids.map(async (uid) => {
        const removedFactUid = await this.removeEntity(uid);
        removedFactUids.push(removedFactUid);
      }),
    );
    return removedFactUids;
  }

  async getSubtypes(uid: number) {
    const result = await this.archivistService.getSubtypes(uid);
    const models = await this.modelsFromFacts(result);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };
    return payload;
  }

  async getSubtypesCone(uid: number) {
    const result = await this.archivistService.getSubtypesCone(uid);
    const models = await this.modelsFromFacts(result);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };
    return payload;
  }

  async listSubtypes(uid: number) {
    const result = await this.archivistService.getSubtypes(uid);
    const models = await this.modelsFromFacts(result);
    const payload = { facts: result, models };
    return payload;
  }

  // THIS PROBABLY DOESN"T BELONG HERE!!
  // like, weigh the meritts of routing all such calls through CC vs. giving NOUS and Integrator direct access to the DB layer
  async textSearch(searchTerm: string) {
    // const selectedEntity = await es.getSelectedEntity();
    const selectedEntity = await this.getSelectedEntity();
    const searchResult: any =
      await this.archivistService.textSearchExact(searchTerm);
    if (searchResult.facts.length === 0) return { facts: [], models: [] };
    const relResult = await this.archivistService.getFactsRelatingEntities(
      searchResult.facts[0].lh_object_uid,
      +selectedEntity,
    );
    const facts = searchResult.facts.concat(relResult);
    // // console.log(Object.entries(result));
    // // console.log(result.facts);
    const models = await this.modelsFromFacts(facts);
    this.insertFacts(facts);
    this.insertModels(models);
    // socketServer.emit('system', 'addFacts', { facts, models });
    return { facts: facts, models };
  }

  async specializeKind(uid: number, supertypeName: string, name: string) {
    const result = await this.archivistService.createKind(
      uid,
      supertypeName,
      name,
      'this is a test',
    );
    // //refresh the category-descendants cache on client-side
    // socketServer.emit('system', 'updateCategoryDescendantsCache', {});
    if (result.success) {
      const { fact } = result;
      const facts = [fact];
      const models = await this.modelsFromFacts(facts);
      this.insertFacts(facts);
      this.insertModels(models);
      // socketServer.emit('system', 'addFacts', { facts, models });
      return { success: true, uid: fact.lh_object_uid };
    }
    return { error: 'failed to specialize kind' };
    // console.log('specialized Kind', result);
  }

  async classifyIndividual(uid: number, typeName: string, name: string) {
    const result = await this.archivistService.createIndividual(
      uid,
      typeName,
      name,
      'this is a test',
    );
    // //refresh the category-descendants cache on client-side
    // socketServer.emit('system', 'updateCategoryDescendantsCache', {});
    if (result.success) {
      const { fact } = result;
      const facts = [fact];
      const models = await this.modelsFromFacts(facts);
      this.insertFacts(facts);
      this.insertModels(models);
      // socketServer.emit('system', 'addFacts', { facts, models });
      return { success: true, uid: fact.lh_object_uid };
    }
    return { error: 'failed to classify individual' };
    // console.log('classified Individual', result);
  }

  async getClassified(uid: number) {
    const result = await this.archivistService.getClassified(uid);
    const facts = result;
    const models = await this.modelsFromFacts(facts);
    this.insertFacts(facts);
    this.insertModels(models);
    // socketServer.emit('system', 'addFacts', { facts, models });
    return { success: true, facts, models };
  }

  async getClassificationFactByUID(uid: number) {
    const result = await this.archivistService.getClassificationFact(uid);
    const models = await this.modelsFromFacts(result);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };
    // socketServer.emit('system', 'addFacts', payload);
    return payload;
  }
}
