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

import { jsToMal, malToJs } from './utils';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class REPLService {
  private logger: Logger = new Logger('REPLService');

  constructor(
    private archivist: ArchivistService,
    private environment: EnvironmentService,
    private eventEmitter: EventEmitter2,
  ) {}

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
        const foo = await Promise.all(
          ast.list.map((ast) => this.EVAL(ast, env)),
        );
        return new MalList(foo);
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
    this.logger.log('REP START -> ', str);
    const result = await this.EVAL(this.READ(str), replEnv);
    this.logger.log('REP END -> ', this.PRINT(result));
    return this.PRINT(result);
  }

  async exec(str: string): Promise<any> {
    this.logger.log('REP START');

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
      MalSymbol.get('emit'),
      MalFunction.fromBootstrap(
        async (event: MalString, payload: MalHashMap) => {
          console.log('emit', event.v, malToJs(payload));
          this.eventEmitter.emit(event.v, malToJs(payload));
          return MalNil.instance;
        },
      ),
    );

    await this.rep('(def! not (fn* (a) (if a false true)))', replEnv);

    try {
      if (str) {
        return await this.rep(str, replEnv);
      }
    } catch (e) {
      const err: Error = e;
      this.logger.error(err.message);
    }

    this.logger.log('EXEC END');
  }
}
