import { Injectable } from '@nestjs/common';

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
} from './types';
import { Env } from './env';
import * as core from './core';
import { readStr } from './reader';
import { prStr } from './printer';
import { Logger } from '@nestjs/common';

import { ArchivistService } from '../archivist/archivist.service';
import { EnvironmentService } from '../environment/environment.service';
import { State, StateService } from '../state/state.service';

import { jsToMal, malToJs } from './utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Fact } from '@relica/types';

@Injectable()
export class REPLService {
  private logger: Logger = new Logger('REPLService');
  private replEnv: Env;

  constructor(
    private archivist: ArchivistService,
    private environment: EnvironmentService,
    private eventEmitter: EventEmitter2,
    private stateService: StateService,
  ) {
    this.initReplEnv();
  }

  private async initReplEnv() {
    const replEnv = new Env();

    core.ns.forEach((value, key) => {
      replEnv.set(key, value);
    });

    replEnv.set(
      MalSymbol.get('delay'),
      MalFunction.fromBootstrap(async (duration: MalNumber) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(MalNil.instance), duration.v);
        });
      }),
    );

    replEnv.set(
      MalSymbol.get('retrieveAllFacts'),
      MalFunction.fromBootstrap(async (uid: MalNumber): Promise<any> => {
        const res = await this.archivist.retrieveAllFacts(uid.v);
        return jsToMal(res);
      }),
    );

    replEnv.set(
      MalSymbol.get('getSpecializationHierarchy'),
      MalFunction.fromBootstrap(async (uid: MalNumber): Promise<any> => {
        const res = await this.archivist.getSpecializationHierarchy(uid.v);
        return jsToMal(res);
      }),
    );

    replEnv.set(
      MalSymbol.get('modelsFromFacts'),
      MalFunction.fromBootstrap(async (facts: MalVector): Promise<MalType> => {
        const res = await this.environment.modelsFromFacts(malToJs(facts));
        return jsToMal(res);
      }),
    );

    replEnv.set(
      MalSymbol.get('insertFacts'),
      MalFunction.fromBootstrap(async (facts: MalVector): Promise<MalType> => {
        const res = await this.environment.insertFacts(malToJs(facts));
        return jsToMal(res);
      }),
    );

    replEnv.set(
      MalSymbol.get('insertModels'),
      MalFunction.fromBootstrap(async (models: MalVector): Promise<MalType> => {
        const res = await this.environment.insertModels(malToJs(models));
        return jsToMal(res);
      }),
    );

    replEnv.set(
      MalSymbol.get('selectEntity'),
      MalFunction.fromBootstrap(async (uid: MalNumber) => {
        const entityUID: number | null =
          await this.environment.setSelectedEntity(uid.v, 'entity');
        return entityUID ? new MalNumber(entityUID) : MalNil.instance;
      }),
    );

    replEnv.set(
      MalSymbol.get('selectFact'),
      MalFunction.fromBootstrap(async (uid: MalNumber) => {
        const entityUID: number | null =
          await this.environment.setSelectedEntity(uid.v, 'fact');
        return entityUID ? new MalNumber(entityUID) : MalNil.instance;
      }),
    );

    replEnv.set(
      MalSymbol.get('selectNone'),
      MalFunction.fromBootstrap(async (uid: MalNumber) => {
        await this.environment.setSelectedEntity(null);
        return MalNil.instance;
      }),
    );

    replEnv.set(
      MalSymbol.get('loadSubtypesCone'),
      MalFunction.fromBootstrap(async (uid: MalNumber) => {
        const res = await this.environment.loadSubtypesCone(uid.v);
        return jsToMal(res);
      }),
    );

    replEnv.set(
      MalSymbol.get('unloadEntity'),
      MalFunction.fromBootstrap(async (uid: MalNumber) => {
        const removedFacts = await this.environment.unloadEntity(uid.v);
        return jsToMal(removedFacts);
      }),
    );

    replEnv.set(
      MalSymbol.get('loadEntity'),
      MalFunction.fromBootstrap(async (uid: MalNumber) => {
        const res = await this.environment.loadEntity(uid.v);
        return jsToMal(res);
      }),
    );

    replEnv.set(
      MalSymbol.get('loadEntities'),
      MalFunction.fromBootstrap(async (uids: MalVector) => {
        let facts: Fact[] = [];
        let models: any[] = [];
        const xxx = malToJs(uids);
        for (let i = 0; i < xxx.length; i++) {
          const payload = await this.environment.loadEntity(xxx[i]);
          facts = facts.concat(payload.facts);
          models = models.concat(payload.models);
        }
        const payload = { facts, models };
        return jsToMal(payload);
      }),
    );

    replEnv.set(
      MalSymbol.get('unloadEntities'),
      MalFunction.fromBootstrap(async (uids: MalVector) => {
        console.log('unloadEntities', malToJs(uids));
        const removedFacts = await this.environment.removeEntities(
          malToJs(uids),
        );
        return jsToMal(removedFacts);
      }),
    );

    replEnv.set(
      MalSymbol.get('clearEntities'),
      MalFunction.fromBootstrap(async (event: MalString, payload: MalType) => {
        this.environment.clearEntities();
        return MalNil.instance;
      }),
    );

    replEnv.set(
      MalSymbol.get('emit'),
      MalFunction.fromBootstrap(
        async (event: MalString, payload: MalHashMap) => {
          this.eventEmitter.emit('emit', {
            type: event.v,
            payload: malToJs(payload),
          });
          return MalNil.instance;
        },
      ),
    );

    replEnv.set(
      MalSymbol.get('changeState'),
      MalFunction.fromBootstrap(async (state: MalString) => {
        this.stateService.setState(state.v as State);
        return MalNil.instance;
      }),
    );

    const loadAllRelatedFactsDef = `
(def! loadAllRelatedFacts (fn* [uid]
(let* [result (retrieveAllFacts uid)
models (modelsFromFacts result)]
(do
  (insertFacts result)
  (insertModels models)))
))`;
    await this.rep(loadAllRelatedFactsDef, replEnv);

    const loadSpecializationHierarchyDef = `
(def! loadSpecializationHierarchy (fn* [uid]
(let* [result (getSpecializationHierarchy uid)
facts  (get result :facts )
models (modelsFromFacts facts)
payload {:facts facts :models models}]
(do
  (insertFacts facts)
  (insertModels models)))
))`;
    await this.rep(loadSpecializationHierarchyDef, replEnv);

    await this.rep('(def! not (fn* (a) (if a false true)))', replEnv);

    this.replEnv = replEnv;
  }

  // READ
  READ(str: string): MalType {
    return readStr(str);
  }

  // EVAL
  private async evalAST(ast: MalType, env: Env): Promise<MalType> {
    switch (ast.type) {
      case Node.Symbol:
        const f = env.get(ast);
        if (!f) {
          throw new Error(`unknown symbol: ${ast.v}`);
        }
        return f;
      case Node.List:
        // do it sequentially, not in parallel ... the dumb way
        let results = [];
        const l = ast.list.length;
        for (let i = 0; i < l; i++) {
          const a = ast.list[i];
          results.push(await this.EVAL(a, env));
        }

        return new MalList(results);
      case Node.Vector:
        const bar = await Promise.all(
          ast.list.map((ast) => this.EVAL(ast, env)),
        );
        return new MalVector(bar);
      case Node.HashMap:
        const list: MalType[] = [];
        for (const [key, value] of ast.entries()) {
          list.push(key);
          list.push(await this.EVAL(value, env));
        }
        return new MalHashMap(list);
      default:
        return ast;
    }
  }

  async EVAL(ast: MalType, env: Env): Promise<MalType> {
    if (ast.type !== Node.List) {
      return this.evalAST(ast, env);
    }
    if (ast.list.length === 0) {
      return ast;
    }
    const first = ast.list[0];
    switch (first.type) {
      case Node.Symbol:
        switch (first.v) {
          case 'def!': {
            const [, key, value] = ast.list;
            if (key.type !== Node.Symbol) {
              throw new Error(
                `unexpected toke type: ${key.type}, expected: symbol`,
              );
            }
            if (!value) {
              throw new Error(`unexpected syntax`);
            }
            return env.set(key, await this.EVAL(value, env));
          }
          case 'let*': {
            let letEnv = new Env(env);
            const pairs = ast.list[1];
            if (!isSeq(pairs)) {
              throw new Error(
                `unexpected token type: ${pairs.type}, expected: list or vector`,
              );
            }
            for (let i = 0; i < pairs.list.length; i += 2) {
              const key = pairs.list[i];
              const value = pairs.list[i + 1];
              if (key.type !== Node.Symbol) {
                throw new Error(
                  `unexpected token type: ${key.type}, expected: symbol`,
                );
              }
              if (!key || !value) {
                throw new Error(`unexpected syntax`);
              }

              letEnv.set(key, await this.EVAL(value, letEnv));
            }
            return await this.EVAL(ast.list[2], letEnv);
          }
          case 'do': {
            const [, ...list] = ast.list;
            const ret = await this.evalAST(new MalList(list), env);
            if (!isSeq(ret)) {
              throw new Error(
                `unexpected return type: ${ret.type}, expected: list or vector`,
              );
            }
            return ret.list[ret.list.length - 1];
          }
          case 'if': {
            const [, cond, thenExpr, elseExrp] = ast.list;
            const ret = await this.EVAL(cond, env);
            let b = true;
            if (ret.type === Node.Boolean && !ret.v) {
              b = false;
            } else if (ret.type === Node.Nil) {
              b = false;
            }
            if (b) {
              return await this.EVAL(thenExpr, env);
            } else if (elseExrp) {
              return await this.EVAL(elseExrp, env);
            } else {
              return MalNil.instance;
            }
          }
          case 'fn*': {
            const [, args, binds] = ast.list;
            if (!isSeq(args)) {
              throw new Error(
                `unexpected return type: ${args.type}, expected: list or vector`,
              );
            }
            const symbols = args.list.map((param) => {
              if (param.type !== Node.Symbol) {
                throw new Error(
                  `unexpected return type: ${param.type}, expected: symbol`,
                );
              }
              return param;
            });
            return MalFunction.fromBootstrap(async (...fnArgs: MalType[]) => {
              return await this.EVAL(binds, new Env(env, symbols, fnArgs));
            });
          }
        }
    }

    const result = await this.evalAST(ast, env);
    if (!isSeq(result)) {
      throw new Error(
        `unexpected return type: ${result.type}, expected: list or vector`,
      );
    }
    const [f, ...args] = result.list;
    if (f.type !== Node.Function) {
      throw new Error(`unexpected token: ${f.type}, expected: function`);
    }

    return await f.func(...args);
  }

  // PRINT
  PRINT(exp: MalType): string {
    return prStr(exp);
  }

  // REP
  async rep(str: string, replEnv: any): Promise<string> {
    // this.logger.log('REP START -> ', str);
    const result = await this.EVAL(this.READ(str), replEnv);
    // this.logger.log('REP END -> ', this.PRINT(result));
    return this.PRINT(result);
  }

  private _expressionQueue: any[] = [];
  private _queueProcessing = false;

  private async _processQueue(): Promise<void> {
    if (this._queueProcessing) {
      return;
    }
    this._queueProcessing = true;

    while (this._expressionQueue.length > 0) {
      const [str, resolve] = this._expressionQueue.shift();
      try {
        if (str) {
          const res = await this.rep(str, this.replEnv);
          resolve(res);
        }
      } catch (e) {
        const err: Error = e;
        this.logger.error(err.message);
      } finally {
        this.logger.log('EXEC END');
      }
    }

    this._queueProcessing = false;
  }

  async exec(str: string, resolve: any): Promise<any> {
    this._expressionQueue.push([str, resolve]);
    return await this._processQueue();
  }
}
