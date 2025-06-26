import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Environment } from "./entities/environment.entity";
import { ArchivistSocketClient } from "@relica/websocket-clients";

@Injectable()
export class EnvironmentService {
  constructor(
    @InjectRepository(Environment)
    private environmentRepository: Repository<Environment>,
    private readonly archivistClient: ArchivistSocketClient
  ) {}

  async create(data: { name: string; userId: string }): Promise<Environment> {
    const environment = this.environmentRepository.create({
      ...data,
      facts: [],
    });
    return this.environmentRepository.save(environment);
  }

  async findAll(userId: string): Promise<Environment[]> {
    return this.environmentRepository.find({
      where: { userId },
      order: { updatedAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string): Promise<Environment> {
    const environment = await this.environmentRepository.findOne({
      where: { id, userId },
    });

    if (!environment) {
      throw new NotFoundException("Environment not found");
    }

    return environment;
  }

  async findDefaultForUser(userId: string): Promise<Environment> {
    const environments = await this.findAll(userId);

    if (environments.length === 0) {
      return this.create({
        name: "Default Environment",
        userId,
      });
    }

    return environments[0];
  }

  async update(
    id: string,
    userId: string,
    updateData: Partial<Environment>
  ): Promise<Environment> {
    const environment = await this.findOne(id, userId);

    Object.assign(environment, updateData);

    return this.environmentRepository.save(environment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const environment = await this.findOne(id, userId);
    await this.environmentRepository.remove(environment);
  }

  async selectEntity(
    id: string,
    userId: string,
    entityId: string
  ): Promise<Environment> {
    return this.update(id, userId, { selectedEntityId: entityId });
  }

  async deselectEntity(id: string, userId: string): Promise<Environment> {
    return this.update(id, userId, { selectedEntityId: null });
  }

  async addFacts(
    id: string,
    userId: string,
    facts: any[]
  ): Promise<Environment> {
    const environment = await this.findOne(id, userId);

    const existingFactUids = new Set(
      environment.facts.map((fact) => fact.fact_uid)
    );

    const newFacts = facts.filter(
      (fact) => !existingFactUids.has(fact.fact_uid)
    );

    const updatedFacts = [...environment.facts, ...newFacts];

    return this.update(id, userId, { facts: updatedFacts });
  }

  async removeFacts(
    id: string,
    userId: string,
    factUids: string[]
  ): Promise<Environment> {
    const environment = await this.findOne(id, userId);

    const factUidsToRemove = new Set(factUids);
    const remainingFacts = environment.facts.filter(
      (fact) => !factUidsToRemove.has(fact.fact_uid)
    );

    return this.update(id, userId, { facts: remainingFacts });
  }

  async clearFacts(id: string, userId: string): Promise<Environment> {
    return this.update(id, userId, { facts: [] });
  }

  async loadSpecializationHierarchy(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<{
    success: boolean;
    facts?: any[];
    environment?: Environment;
    error?: string;
  }> {
    try {
      // Get or create the environment
      let environment: Environment;
      if (environmentId) {
        environment = await this.findOne(
          environmentId.toString(),
          userId.toString()
        );
      } else {
        environment = await this.findDefaultForUser(userId.toString());
      }

      // Call Archivist to get specialization hierarchy facts
      // This would typically call a method like getSubtypesCone or similar
      // For now, we'll use a placeholder that matches the expected pattern
      const facts = await this.archivistClient.getSubtypesCone(uid);

      // Add the facts to the environment
      const updatedEnvironment = await this.addFacts(
        environment.id,
        userId.toString(),
        Array.isArray(facts) ? facts : []
      );

      return {
        success: true,
        facts: Array.isArray(facts) ? facts : [],
        environment: updatedEnvironment,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to load specialization hierarchy",
      };
    }
  }

  async loadAllRelatedFacts(
    userId: number,
    environmentId: string,
    uid: number
  ): Promise<{
    success: boolean;
    facts?: any[];
    environment?: Environment;
    error?: string;
  }> {
    try {
      console.log("EnvironmentService.loadAllRelatedFacts", uid);
      const result = await this.archivistClient.getAllRelated(uid);
      const environment = await this.findOne(environmentId, userId.toString());
      const oldFacts = environment.facts;
      const facts = result;
      const combinedFacts = [...oldFacts, ...facts];
      const newFacts = deduplicateFacts(combinedFacts);
      const updatedEnvironment = await this.addFacts(
        environment.id,
        userId.toString(),
        newFacts
      );
      return { success: true, facts, environment: updatedEnvironment };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to load all related facts",
      };
    }
  }
}

const deduplicateFacts = (facts: any[]): any[] => {
  return facts.filter(
    (fact, index, self) =>
      index === self.findIndex((t) => t.fact_uid === fact.fact_uid)
  );
};
