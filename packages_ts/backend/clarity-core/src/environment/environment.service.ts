import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvFact } from './envFact.entity.js';
import { EnvModel } from './envModel.entity.js';
import { EnvSelectedEntity } from './envSelectedEntity.entity.js';
import { UserEnvironment } from './user-environment.entity.js';
import { Fact } from '@relica/types';
import { EntityFactEnum } from './envSelectedEntity.entity.js';
import { ModelService } from '../model/model.service.js';
import { ArchivistService } from '../archivist/archivist.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);
  // private userEnvironments: Map<string, REPLEnvironment> = new Map();

  constructor(
    @InjectRepository(EnvFact)
    private readonly envFactRepository: Repository<EnvFact>,
    @InjectRepository(EnvModel)
    private readonly envModelRepository: Repository<EnvModel>,
    @InjectRepository(EnvSelectedEntity)
    private readonly envSelectedEntityRepository: Repository<EnvSelectedEntity>,
    @InjectRepository(UserEnvironment)
    private readonly userEnvRepository: Repository<UserEnvironment>,

    private readonly modelService: ModelService,
    private readonly archivistService: ArchivistService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // async getUserEnvironment(userId: string) {
  //   // Try memory first
  //   let replEnv = this.userEnvironments.get(userId);

  //   if (!replEnv) {
  //     // Load from database
  //     let userEnv = await this.userEnvRepository.findOne({ where: { userId } });

  //     if (!userEnv) {
  //       // Create new environment
  //       userEnv = await this.initializeUserEnvironment(userId);
  //     }

  //     // Initialize REPL environment
  //     replEnv = await this.replService.createEnvironment();
  //     // Restore saved state
  //     if (userEnv.lispEnvironment) {
  //       await this.replService.restoreEnvironment(
  //         replEnv,
  //         userEnv.lispEnvironment,
  //       );
  //     }

  //     this.userEnvironments.set(userId, replEnv);
  //   }

  //   return replEnv;
  // }

  async modelsFromFacts(facts: Fact[], token: string) {
    const entityUIDs = facts.reduce((acc: number[], fact: Fact) => {
      if (!acc.includes(fact.lh_object_uid)) acc.push(fact.lh_object_uid);
      if (!acc.includes(fact.rh_object_uid)) acc.push(fact.rh_object_uid);
      return acc;
    }, []);
    const models = (
      await this.modelService.retrieveModels(entityUIDs, token)
    ).filter((model: any) => model !== null);
    return models;
  }

  async retrieveEnvironment(envID?: string) {
    const models = await this.envModelRepository.find();
    const facts = await this.envFactRepository.find();
    const selectedEntity = await this.envSelectedEntityRepository.find();
    const selectedEntityUID = selectedEntity[0] ? selectedEntity[0].uid : null;

    return {
      models: models.map((row: any) => row.model),
      facts: facts.map((row: any) => row.fact),
      selectedEntity: selectedEntityUID,
    };
  }

  async insertFacts(facts: Fact[]) {
    console.log('INSERT FACTS');
    for (const fact of facts) {
      const newFact = new EnvFact();
      newFact.uid = fact.fact_uid;
      newFact.fact = fact;
      await this.envFactRepository.insert(newFact);
    }

    this.eventEmitter.emit('emit', {
      type: 'system:loadedFacts',
      payload: { facts },
    });
  }

  async insertModels(models: any[]) {
    console.log('INSERT MODELS');
    for (const model of models) {
      const newModel = new EnvModel();
      newModel.uid = model.uid;
      newModel.model = model;
      await this.envModelRepository.save(newModel);
    }

    this.eventEmitter.emit('emit', {
      type: 'system:loadedModels',
      payload: { models },
    });
  }

  async removeModels(uids: number[]) {
    console.log(
      '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! REMOVE MODELS',
      uids,
    );
    if (uids.length === 0) return;
    await this.envModelRepository.delete(uids);

    this.eventEmitter.emit('emit', {
      type: 'system:unloadedModels',
      payload: { model_uids: uids },
    });
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

  async setSelectedEntity(
    uid: number | null,
    type: string | null = null,
  ): Promise<number | null> {
    console.log(
      '///////////////////////////////////////////SET SELECTED ENTITY',
      uid,
      type,
    );
    let ret: number | null = null;
    if (uid === null) {
      await this.envSelectedEntityRepository.update(1, {
        uid: null,
        type: EntityFactEnum.NONE,
      });

      ret = null;
    }
    if (type === 'entity') {
      // only if uid exists as lh_object_uid or rh_object_uid in env_fact
      const res = await this.envFactRepository
        .createQueryBuilder('fact')
        .where("fact.fact->>'lh_object_uid' = :uid", { uid })
        .orWhere("fact.fact->>'rh_object_uid' = :uid", { uid })
        .getMany();

      if (res.length === 0) {
        return;
      }

      console.log('\\\\\\\\\\\\\\\\\\\\\\ SELECTED ENTITY', uid);
      await this.envSelectedEntityRepository.update(1, {
        uid: uid + '',
        type: EntityFactEnum.ENTITY,
      });

      ret = uid;
    } else if (type === 'fact') {
      // only if uid exists as fact_uid in env_fact
      const res = await this.envFactRepository
        .createQueryBuilder('fact')
        .where("fact.fact->>'fact_uid' = :uid", { uid })
        .getMany();

      if (res.length === 0) {
        return;
      }

      await this.envSelectedEntityRepository.update(1, {
        uid: uid + '',
        type: EntityFactEnum.FACT,
      });

      ret = uid;
    }

    this.eventEmitter.emit('emit', {
      type: 'system:selectedEntity',
      payload: { uid: ret },
    });

    return ret;
  }

  async getSelectedEntity() {
    const res = await this.envSelectedEntityRepository.find();
    if (res.length === 0) {
      return null;
    }
    return res[0].uid;
  }

  //

  async getSpecializationHierarchy(uid: number, token: string) {
    // const result = await this.archivistService.getSpecializationHierarchy(uid);
    const result = { facts: [] };
    const facts = result.facts;
    const models = await this.modelsFromFacts(facts, token);
    this.insertFacts(facts);
    this.insertModels(models);
    const payload = { facts, models };
    return payload;
  }

  async getSpecializationFactByUID(uid: number, token: string) {
    const result = await this.archivistService.getSpecializationFact(uid);
    const models = await this.modelsFromFacts(result, token);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };
    return payload;
  }

  async loadEntity(uid: number, token: string) {
    if (uid === undefined) return { facts: [], models: [] };
    const selectedEntity = await this.getSelectedEntity();
    const defResult = await this.archivistService.getDefinitiveFacts(
      uid,
      token,
    );
    const relResult = await this.archivistService.getFactsRelatingEntities(
      uid,
      +selectedEntity,
    );
    const result = defResult.concat(relResult);
    const models = await this.modelsFromFacts(result, token);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };

    return payload;
  }

  async unloadEntity(uid: number) {
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
      // TODO: i don't this all the models needing to be removed are being removed
      this.removeModels(Array.from(candidateModelUIDsToRemove));

    return factUIDsToRemove;
  }

  async removeFact(uid: number) {
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
    await this.removeFacts([uid]);
    if (candidateModelUIDsToRemove.size > 0)
      // TODO: i don't this all the models needing to be removed are being removed
      this.removeModels(Array.from(candidateModelUIDsToRemove));
  }

  async removeFacts(uids: number[]) {
    console.log(
      '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! REMOVE FACTS',
      uids,
    );
    if (uids.length === 0) return;
    await this.envFactRepository.delete(uids);

    this.eventEmitter.emit('emit', {
      type: 'system:unloadedFacts',
      payload: { fact_uids: uids },
    });
  }

  async clearEntities() {
    this.clearEnvironment();

    this.eventEmitter.emit('emit', {
      type: 'system:entitiesCleared',
      payload: {},
    });
  }

  async removeEntities(uids: number[]) {
    let removedFactUids = [];
    await Promise.all(
      uids.map(async (uid) => {
        const removedFactUid = await this.unloadEntity(uid);
        removedFactUids = removedFactUids.concat(removedFactUid);
      }),
    );

    return removedFactUids;
  }

  async getSubtypes(uid: number, token: string) {
    const result = await this.archivistService.getSubtypes(uid);
    const models = await this.modelsFromFacts(result, token);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };
    return payload;
  }

  async loadSubtypesCone(uid: number, token: string) {
    const result = await this.archivistService.getSubtypesCone(uid);
    const models = await this.modelsFromFacts(result, token);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };
    return payload;
  }

  async listSubtypes(uid: number, token: string) {
    console.log('LIST SUBTYPES');
    const result = await this.archivistService.getSubtypes(uid);
    const models = await this.modelsFromFacts(result, token);
    const payload = { facts: result, models };
    return payload;
  }

  // THIS PROBABLY DOESN"T BELONG HERE!!
  // TODO: weigh the meritts of routing all such calls through CC vs. giving NOUS and Integrator direct access to the DB layer
  async textSearch(searchTerm: string, token: string) {
    const selectedEntity = await this.getSelectedEntity();
    const searchResult: any =
      await this.archivistService.textSearchExact(searchTerm);
    console.log('TEXT SEARCH', searchResult);
    if (searchResult.facts.length === 0) return { facts: [], models: [] };
    const relResult = await this.archivistService.getFactsRelatingEntities(
      searchResult.facts[0].lh_object_uid,
      +selectedEntity,
    );
    const facts = searchResult.facts.concat(relResult);
    const models = await this.modelsFromFacts(facts, token);
    this.insertFacts(facts);
    this.insertModels(models);
    return { facts: facts, models };
  }

  async specializeKind(
    uid: number,
    supertypeName: string,
    name: string,
    token: string,
  ) {
    const result = await this.archivistService.createKind(
      uid,
      supertypeName,
      name,
      'this is a test',
    );
    // //refresh the category-descendants cache on client-side
    if (result.success) {
      const { fact } = result;
      const facts = [fact];
      const models = await this.modelsFromFacts(facts, token);
      this.insertFacts(facts);
      this.insertModels(models);
      return { success: true, uid: fact.lh_object_uid };
    }
    return { error: 'failed to specialize kind' };
  }

  async classifyIndividual(
    uid: number,
    typeName: string,
    name: string,
    token: string,
  ) {
    const result = await this.archivistService.createIndividual(
      uid,
      typeName,
      name,
      'this is a test',
    );
    // //refresh the category-descendants cache on client-side
    if (result.success) {
      const { fact } = result;
      const facts = [fact];
      const models = await this.modelsFromFacts(facts, token);
      this.insertFacts(facts);
      this.insertModels(models);
      return { success: true, uid: fact.lh_object_uid };
    }
    return { error: 'failed to classify individual' };
  }

  async getClassified(uid: number, token: string) {
    const result = await this.archivistService.getClassified(uid);
    const facts = result;
    const models = await this.modelsFromFacts(facts, token);
    this.insertFacts(facts);
    this.insertModels(models);
    return { success: true, facts, models };
  }

  async getClassificationFactByUID(uid: number, token: string) {
    const result = await this.archivistService.getClassificationFact(uid);
    const models = await this.modelsFromFacts(result, token);
    this.insertFacts(result);
    this.insertModels(models);
    const payload = { facts: result, models };
    return payload;
  }

  async loadAllRelatedFacts(uid: number, token: string) {
    const results = await this.archivistService.retrieveAllFacts(uid, token);
    const models = await this.modelsFromFacts(results, token);
    this.insertFacts(results);
    this.insertModels(models);
    const payload = { facts: results, models };
    return payload;
  }
}
