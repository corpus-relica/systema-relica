import * as fs from 'fs';

// import { readline } from './node_readline';

import {
  Node,
  MalType,
  MalSymbol,
  MalFunction,
  MalNil,
  MalList,
  MalVector,
  MalBoolean,
  MalNumber,
  MalString,
  MalKeyword,
  MalHashMap,
  MalAtom,
  equals,
  isSeq,
} from './types';
import { readStr } from './reader';
import { prStr } from './printer';

export const ns: Map<MalSymbol, MalFunction> = (() => {
  const ns: { [symbol: string]: typeof MalFunction.prototype.func } = {
    async '='(a: MalType, b: MalType): Promise<MalBoolean> {
      return new MalBoolean(equals(a, b));
    },

    async throw(v: MalType): Promise<MalType> {
      throw v;
    },

    async 'nil?'(v: MalType) {
      return new MalBoolean(v.type === Node.Nil);
    },
    async 'true?'(v: MalType) {
      return new MalBoolean(v.type === Node.Boolean && v.v);
    },
    async 'false?'(v: MalType) {
      return new MalBoolean(v.type === Node.Boolean && !v.v);
    },
    async 'string?'(v: MalType) {
      return new MalBoolean(v.type === Node.String);
    },
    async symbol(v: MalType) {
      if (v.type !== Node.String) {
        throw new Error(`unexpected symbol: ${v.type}, expected: string`);
      }
      return MalSymbol.get(v.v);
    },
    async 'symbol?'(v: MalType) {
      return new MalBoolean(v.type === Node.Symbol);
    },
    async keyword(v: MalType) {
      if (v.type === Node.Keyword) {
        return v;
      }
      if (v.type !== Node.String) {
        throw new Error(`unexpected symbol: ${v.type}, expected: string`);
      }
      return MalKeyword.get(v.v);
    },
    async 'keyword?'(v: MalType) {
      return new MalBoolean(v.type === Node.Keyword);
    },
    async 'number?'(v: MalType) {
      return new MalBoolean(v.type === Node.Number);
    },
    async 'fn?'(v: MalType) {
      return new MalBoolean(v.type === Node.Function && !v.isMacro);
    },
    async 'macro?'(v: MalType) {
      return new MalBoolean(v.type === Node.Function && v.isMacro);
    },

    async 'pr-str'(...args: MalType[]): Promise<MalString> {
      return new MalString(args.map((v) => prStr(v, true)).join(' '));
    },
    async str(...args: MalType[]): Promise<MalString> {
      return new MalString(args.map((v) => prStr(v, false)).join(''));
    },
    async prn(...args: MalType[]): Promise<MalNil> {
      const str = args.map((v) => prStr(v, true)).join(' ');
      console.log(str);
      return MalNil.instance;
    },
    async println(...args: MalType[]): Promise<MalNil> {
      const str = args.map((v) => prStr(v, false)).join(' ');
      console.log(str);
      return MalNil.instance;
    },
    async 'read-string'(v: MalType) {
      if (v.type !== Node.String) {
        throw new Error(`unexpected symbol: ${v.type}, expected: string`);
      }
      return readStr(v.v);
    },
    // readline(v: MalType) {
    //   if (v.type !== Node.String) {
    //     throw new Error(`unexpected symbol: ${v.type}, expected: string`);
    //   }

    //   const ret = readline(v.v);
    //   if (ret == null) {
    //     return MalNil.instance;
    //   }

    //   return new MalString(ret);
    // },
    async slurp(v: MalType) {
      if (v.type !== Node.String) {
        throw new Error(`unexpected symbol: ${v.type}, expected: string`);
      }
      const content = fs.readFileSync(v.v, 'utf-8');
      return new MalString(content);
    },

    async '<'(a: MalType, b: MalType): Promise<MalBoolean> {
      if (a.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${a.type}, expected: number`);
      }
      if (b.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${b.type}, expected: number`);
      }

      return new MalBoolean(a.v < b.v);
    },
    async '<='(a: MalType, b: MalType): Promise<MalBoolean> {
      if (a.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${a.type}, expected: number`);
      }
      if (b.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${b.type}, expected: number`);
      }

      return new MalBoolean(a.v <= b.v);
    },
    async '>'(a: MalType, b: MalType): Promise<MalBoolean> {
      if (a.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${a.type}, expected: number`);
      }
      if (b.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${b.type}, expected: number`);
      }

      return new MalBoolean(a.v > b.v);
    },
    async '>='(a: MalType, b: MalType): Promise<MalBoolean> {
      if (a.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${a.type}, expected: number`);
      }
      if (b.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${b.type}, expected: number`);
      }

      return new MalBoolean(a.v >= b.v);
    },
    async '+'(a: MalType, b: MalType): Promise<MalNumber> {
      if (a.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${a.type}, expected: number`);
      }
      if (b.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${b.type}, expected: number`);
      }

      return new MalNumber(a.v + b.v);
    },
    async '-'(a: MalType, b: MalType): Promise<MalNumber> {
      if (a.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${a.type}, expected: number`);
      }
      if (b.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${b.type}, expected: number`);
      }

      return new MalNumber(a.v - b.v);
    },
    async '*'(a: MalType, b: MalType): Promise<MalNumber> {
      if (a.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${a.type}, expected: number`);
      }
      if (b.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${b.type}, expected: number`);
      }

      return new MalNumber(a.v * b.v);
    },
    async '/'(a: MalType, b: MalType): Promise<MalNumber> {
      if (a.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${a.type}, expected: number`);
      }
      if (b.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${b.type}, expected: number`);
      }

      return new MalNumber(a.v / b.v);
    },
    async 'time-ms'() {
      return new MalNumber(Date.now());
    },

    async list(...args: MalType[]): Promise<MalList> {
      return new MalList(args);
    },
    async 'list?'(v: MalType): Promise<MalBoolean> {
      return new MalBoolean(v.type === Node.List);
    },
    async vector(...args: MalType[]): Promise<MalVector> {
      return new MalVector(args);
    },
    async 'vector?'(v: MalType): Promise<MalBoolean> {
      return new MalBoolean(v.type === Node.Vector);
    },
    async 'hash-map'(...args: MalType[]) {
      return new MalHashMap(args);
    },
    async 'map?'(v: MalType): Promise<MalBoolean> {
      return new MalBoolean(v.type === Node.HashMap);
    },
    async assoc(v: MalType, ...args: MalType[]) {
      if (v.type !== Node.HashMap) {
        throw new Error(`unexpected symbol: ${v.type}, expected: hash-map`);
      }
      return v.assoc(args);
    },
    async dissoc(v: MalType, ...args: MalType[]) {
      if (v.type !== Node.HashMap) {
        throw new Error(`unexpected symbol: ${v.type}, expected: hash-map`);
      }
      return v.dissoc(args);
    },
    async get(v: MalType, key: MalType) {
      if (v.type === Node.Nil) {
        return MalNil.instance;
      }
      if (v.type !== Node.HashMap) {
        throw new Error(`unexpected symbol: ${v.type}, expected: hash-map`);
      }
      if (key.type !== Node.String && key.type !== Node.Keyword) {
        throw new Error(
          `unexpected symbol: ${key.type}, expected: string or keyword`,
        );
      }

      return v.get(key) || MalNil.instance;
    },
    async 'contains?'(v: MalType, key: MalType) {
      if (v.type === Node.Nil) {
        return MalNil.instance;
      }
      if (v.type !== Node.HashMap) {
        throw new Error(`unexpected symbol: ${v.type}, expected: hash-map`);
      }
      if (key.type !== Node.String && key.type !== Node.Keyword) {
        throw new Error(
          `unexpected symbol: ${key.type}, expected: string or keyword`,
        );
      }

      return new MalBoolean(v.has(key));
    },
    async keys(v: MalType) {
      if (v.type !== Node.HashMap) {
        throw new Error(`unexpected symbol: ${v.type}, expected: hash-map`);
      }

      return new MalList([...v.keys()]);
    },
    async vals(v: MalType) {
      if (v.type !== Node.HashMap) {
        throw new Error(`unexpected symbol: ${v.type}, expected: hash-map`);
      }

      return new MalList([...v.vals()]);
    },

    async 'sequential?'(v: MalType) {
      return new MalBoolean(isSeq(v));
    },
    async cons(a: MalType, b: MalType) {
      if (!isSeq(b)) {
        throw new Error(
          `unexpected symbol: ${b.type}, expected: list or vector`,
        );
      }

      return new MalList([a].concat(b.list));
    },
    async concat(...args: MalType[]) {
      const list = args
        .map((arg) => {
          if (!isSeq(arg)) {
            throw new Error(
              `unexpected symbol: ${arg.type}, expected: list or vector`,
            );
          }
          return arg;
        })
        .reduce((p, c) => p.concat(c.list), [] as MalType[]);

      return new MalList(list);
    },
    async vec(a: MalType) {
      switch (a.type) {
        case Node.List:
          return new MalVector(a.list);
        case Node.Vector:
          return a;
      }
      throw new Error(`unexpected symbol: ${a.type}, expected: list or vector`);
    },

    async nth(list: MalType, idx: MalType) {
      if (!isSeq(list)) {
        throw new Error(
          `unexpected symbol: ${list.type}, expected: list or vector`,
        );
      }
      if (idx.type !== Node.Number) {
        throw new Error(`unexpected symbol: ${idx.type}, expected: number`);
      }

      const v = list.list[idx.v];
      if (!v) {
        throw new Error('nth: index out of range');
      }

      return v;
    },
    async first(v: MalType) {
      if (v.type === Node.Nil) {
        return MalNil.instance;
      }
      if (!isSeq(v)) {
        throw new Error(
          `unexpected symbol: ${v.type}, expected: list or vector`,
        );
      }

      return v.list[0] || MalNil.instance;
    },
    async rest(v: MalType) {
      if (v.type === Node.Nil) {
        return new MalList([]);
      }
      if (!isSeq(v)) {
        throw new Error(
          `unexpected symbol: ${v.type}, expected: list or vector`,
        );
      }

      return new MalList(v.list.slice(1));
    },
    async 'empty?'(v: MalType): Promise<MalBoolean> {
      if (!isSeq(v)) {
        return new MalBoolean(false);
      }
      return new MalBoolean(v.list.length === 0);
    },
    async count(v: MalType): Promise<MalNumber> {
      if (isSeq(v)) {
        return new MalNumber(v.list.length);
      }
      if (v.type === Node.Nil) {
        return new MalNumber(0);
      }
      throw new Error(`unexpected symbol: ${v.type}`);
    },
    async apply(f: MalType, ...list: MalType[]) {
      if (f.type !== Node.Function) {
        throw new Error(`unexpected symbol: ${f.type}, expected: function`);
      }

      const tail = list[list.length - 1];
      if (!isSeq(tail)) {
        throw new Error(
          `unexpected symbol: ${tail.type}, expected: list or vector`,
        );
      }
      const args = list.slice(0, -1).concat(tail.list);
      return f.func(...args);
    },
    async map(f: MalType, list: MalType) {
      if (f.type !== Node.Function) {
        throw new Error(`unexpected symbol: ${f.type}, expected: function`);
      }
      if (!isSeq(list)) {
        throw new Error(
          `unexpected symbol: ${list.type}, expected: list or vector`,
        );
      }

      const foo = await Promise.all(list.list.map((v) => f.func(v)));
      return new MalList(foo);
    },

    async conj(list: MalType, ...args: MalType[]) {
      switch (list.type) {
        case Node.List:
          const newList = new MalList(list.list);
          args.forEach((arg) => newList.list.unshift(arg));
          return newList;
        case Node.Vector:
          return new MalVector([...list.list, ...args]);
      }

      throw new Error(
        `unexpected symbol: ${list.type}, expected: list or vector`,
      );
    },
    async seq(v: MalType) {
      if (v.type === Node.List) {
        if (v.list.length === 0) {
          return MalNil.instance;
        }
        return v;
      }
      if (v.type === Node.Vector) {
        if (v.list.length === 0) {
          return MalNil.instance;
        }
        return new MalList(v.list);
      }
      if (v.type === Node.String) {
        if (v.v.length === 0) {
          return MalNil.instance;
        }
        return new MalList(v.v.split('').map((s) => new MalString(s)));
      }
      if (v.type === Node.Nil) {
        return MalNil.instance;
      }

      throw new Error(
        `unexpected symbol: ${v.type}, expected: list or vector or string`,
      );
    },

    async meta(v: MalType) {
      return v.meta || MalNil.instance;
    },
    async 'with-meta'(v: MalType, m: MalType) {
      return v.withMeta(m);
    },
    async atom(v: MalType): Promise<MalAtom> {
      return new MalAtom(v);
    },
    async 'atom?'(v: MalType): Promise<MalBoolean> {
      return new MalBoolean(v.type === Node.Atom);
    },
    async deref(v: MalType): Promise<MalType> {
      if (v.type !== Node.Atom) {
        throw new Error(`unexpected symbol: ${v.type}, expected: atom`);
      }
      return v.v;
    },
    async 'reset!'(atom: MalType, v: MalType): Promise<MalType> {
      if (atom.type !== Node.Atom) {
        throw new Error(`unexpected symbol: ${atom.type}, expected: atom`);
      }
      atom.v = v;
      return v;
    },
    async 'swap!'(
      atom: MalType,
      f: MalType,
      ...args: MalType[]
    ): Promise<MalType> {
      if (atom.type !== Node.Atom) {
        throw new Error(`unexpected symbol: ${atom.type}, expected: atom`);
      }
      if (f.type !== Node.Function) {
        throw new Error(`unexpected symbol: ${f.type}, expected: function`);
      }
      atom.v = await f.func(...[atom.v].concat(args));
      return atom.v;
    },
  };

  const map = new Map<MalSymbol, MalFunction>();
  Object.keys(ns).forEach((key) =>
    map.set(MalSymbol.get(key), MalFunction.fromBootstrap(ns[key])),
  );
  return map;
})();
