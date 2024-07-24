import { Injectable } from '@nestjs/common';

import {
  Node,
  MalType,
  MalNumber,
  MalList,
  MalVector,
  MalHashMap,
  MalSymbol,
  MalFunction,
  isSeq,
} from './types';
import { Env } from './env';
import { readStr } from './reader';
import { prStr } from './printer';
import { Logger } from '@nestjs/common';

@Injectable()
export class REPLService {
  private logger: Logger = new Logger('REPLService');

  constructor() {}

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
                `unexpected toke type: ${pairs.type}, expected: list or vector`,
              );
            }
            const list = pairs.list;
            for (let i = 0; i < list.length; i += 2) {
              const key = list[i];
              const value = list[i + 1];
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
            return this.EVAL(ast.list[2], letEnv);
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
  async rep(str: string): Promise<string> {
    this.logger.log('REP START -> ', str);

    const replEnv = new Env();
    replEnv.set(
      MalSymbol.get('+'),
      MalFunction.fromBootstrap(
        async (a?: MalNumber, b?: MalNumber) => new MalNumber(a!.v + b!.v),
      ),
    );
    replEnv.set(
      MalSymbol.get('-'),
      MalFunction.fromBootstrap(
        async (a?: MalNumber, b?: MalNumber) => new MalNumber(a!.v - b!.v),
      ),
    );
    replEnv.set(
      MalSymbol.get('*'),
      MalFunction.fromBootstrap(
        async (a?: MalNumber, b?: MalNumber) => new MalNumber(a!.v * b!.v),
      ),
    );
    replEnv.set(
      MalSymbol.get('/'),
      MalFunction.fromBootstrap(
        async (a?: MalNumber, b?: MalNumber) => new MalNumber(a!.v / b!.v),
      ),
    );
    replEnv.set(
      MalSymbol.get('delay'),
      MalFunction.fromBootstrap(async (duration: MalNumber) => {
        return new Promise((resolve) => setTimeout(resolve, duration.v));
      }),
    );

    const result = await this.EVAL(this.READ(str), replEnv);
    this.logger.log('REP END -> ', this.PRINT(result));
    return this.PRINT(result);
  }

  exec(str: string): any {
    try {
      if (str) {
        return this.rep(str);
      }
    } catch (e) {
      const err: Error = e;
      this.logger.error(err.message);
    }
  }
}
