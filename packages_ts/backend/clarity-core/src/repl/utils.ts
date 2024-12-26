import {
  MalNil,
  MalType,
  MalString,
  MalNumber,
  MalVector,
  MalHashMap,
  MalKeyword,
} from './types';

export const jsToMal = (obj: any): MalType => {
  if (obj === null) {
    return MalNil.instance;
  }
  if (obj === undefined) {
    return MalNil.instance;
  }
  if (typeof obj === 'string') {
    return new MalString(obj);
  }
  if (typeof obj === 'number') {
    return new MalNumber(obj);
  }
  if (Array.isArray(obj)) {
    const vec = new MalVector(obj.map(jsToMal));
    return vec;
  }
  if (typeof obj === 'object') {
    const list = Object.entries(obj).reduce((acc, [k, v]) => {
      acc.push(MalKeyword.get(k));
      acc.push(jsToMal(v));
      return acc;
    }, []);
    const map = new MalHashMap(list);
    return map;
  }
  return obj;
};

export const malToJs = (mal: MalType): any => {
  if (mal instanceof MalNil) {
    return null;
  }
  if (mal instanceof MalString) {
    return mal.v;
  }
  if (mal instanceof MalKeyword) {
    return mal.v;
  }
  if (mal instanceof MalNumber) {
    return mal.v;
  }
  if (mal instanceof MalVector) {
    return mal.list.map(malToJs);
  }
  if (mal instanceof MalHashMap) {
    const obj = {};
    const entries = mal.entries();
    for (let i = 0; i < entries.length; i++) {
      const key = entries[i][0];
      const value = entries[i][1];
      obj[malToJs(key)] = malToJs(value);
    }
    return obj;
  }
  return mal;
};
