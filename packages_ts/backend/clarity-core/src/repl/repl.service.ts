import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Node,
  MalType,
  MalNil,
  MalList,
  MalVector,
  MalHashMap,
  MalFunction,
  isAST,
  isSeq,
  MalNumber,
  MalSymbol,
  MalString,
} from './types.js';

import { Env } from './env.js';
import * as core from './core.js';
import { readStr } from './reader.js';
import { prStr } from './printer.js';
import { Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { ArchivistService } from '../archivist/archivist.service.js';
import { EnvironmentService } from '../environment/environment.service.js';
import { State, StateService } from '../state/state.service.js';

import { jsToMal, malToJs } from './utils.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Fact } from '@relica/types';

import { REPL } from './repl.js';
import { UserEnvironment } from '../environment/user-environment.entity.js';

@Injectable()
export class REPLService {
  private logger: Logger = new Logger('REPLService');
  private activeRepls: Map<number, REPL> = new Map();

  private tempREPL: REPL;

  // private replEnv: Env;

  constructor(
    // @InjectRepository(UserReplState)
    // private userReplRepository: Repository<UserReplState>,
    @InjectRepository(UserEnvironment)
    private readonly userEnvRepository: Repository<UserEnvironment>,

    private archivistService: ArchivistService,
    private environmentService: EnvironmentService,
    private eventEmitter: EventEmitter2,
    private stateService: StateService,
  ) {
    // private stateService: StateService, // private eventEmitter: EventEmitter2, // private environment: EnvironmentService, // private archivist: ArchivistService,
    // this.initReplEnv();
    this.tempREPL = new REPL(
      this.archivistService,
      this.environmentService,
      this.eventEmitter,
      this.stateService,
    );
    this.tempREPL.initReplEnv();
  }

  exec(fonk, resolve) {
    this.tempREPL.exec(fonk, resolve);
  }

  async getUserRepl(userId: number, token: string): Promise<REPL> {
    console.log('getUserRepl !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1');
    // Check memory first
    let repl = this.activeRepls.get(userId);

    if (!repl) {
      // Create new REPL instance
      repl = new REPL(
        this.archivistService,
        this.environmentService,
        this.eventEmitter,
        this.stateService,
      );

      await repl.initReplEnv();

      // Set token
      repl.setToken(token);

      // Load saved state if exists
      await this.loadUserState(userId, repl);

      this.activeRepls.set(userId, repl);
    }

    return repl;
  }

  private async loadUserState(userId: number, repl: REPL) {
    const savedState = await this.userEnvRepository.findOne({
      where: { userId },
    });

    console.log('savedState', savedState);

    if (savedState && savedState.lispEnv) {
      try {
        // Depending on how you want to store/restore the LISP environment
        // Option 1: If lispEnv contains an array of definitions
        if (Array.isArray(savedState.lispEnv)) {
          for (const def of savedState.lispEnv) {
            try {
              await repl.rep(def.definition, repl.env);
            } catch (error) {
              this.logger.error(
                //@ts-ignore
                `Failed to restore definition: ${error.message}`,
              );
            }
          }
        }
        // Option 2: If lispEnv is a single string or object
        else {
          await repl.rep(savedState.lispEnv, repl.env);
        }
      } catch (error) {
        this.logger.error(
          //@ts-ignore
          `Failed to restore LISP environment: ${error.message}`,
        );
      }
    }
  }

  async saveUserState(userId: number, repl: REPL) {
    const env = repl.env;
    const customDefs: { symbolName: string; definition: string }[] = [];

    // Collect user-defined symbols and their definitions
    for (const [symbol, value] of env.entries) {
      if (this.isUserDefinedSymbol(symbol)) {
        console.log('MUH FUCKING VALUE!!!!');
        console.log(value);
        customDefs.push({
          symbolName: symbol.v,
          definition: repl.PRINT(value),
        });
      }
    }

    await this.userEnvRepository.update(
      { userId },
      {
        lispEnv: customDefs,
        lastAccessed: new Date(),
      },
    );
  }

  private isUserDefinedSymbol(symbol: MalSymbol): boolean {
    // Define what constitutes a user-defined symbol
    // This is a basic example - you might want to enhance this
    const systemSymbols = new Set([
      'token',
      'emit',
      'delay',
      'retrieveAllFacts',
      'getSpecializationHierarchy',
      'modelsFromFacts',
      'insertFacts',
      'insertModels',
      'selectEntity',
      'selectFact',
      'selectNone',
      'loadSubtypesCone',
      'unloadEntity',
      'loadEntity',
      'loadEntities',
      'unloadEntities',
      'clearEntities',
      'changeState',
    ]);

    return !systemSymbols.has(symbol.v);
  }

  // Cleanup inactive REPLs periodically
  @Cron('0 */1 * * * *')
  async cleanupInactiveRepls() {
    const inactiveThreshold = new Date();
    inactiveThreshold.setHours(inactiveThreshold.getHours() - 24);

    const inactiveStates = await this.userEnvRepository.find({
      where: {
        lastAccessed: LessThan(inactiveThreshold),
      },
    });

    for (const state of inactiveStates) {
      this.activeRepls.delete(state.userId);
    }
  }
}
