// import ohm from 'ohm-js';
import { Fact } from '@relica/types';
import * as ohm from 'ohm-js';

interface RegularEntity {
  type: 'regular';
  uid: number;
  name?: string;
  role?: string;
}

const myGrammar = ohm.grammar(String.raw`
Gellish {
  Document = (MetadataLine | Statement)*

  MetadataLine = "@" key "=" value

  Statement = Entity ">" Entity ">" Entity

  Entity = PlaceholderEntity | RegularEntity

  PlaceholderEntity = number "." (identifier | stringLiteral)? Role?

  RegularEntity = number ("." (identifier | stringLiteral))? Role?

  Role = ":" identifier

  key = identifier
  value = stringLiteral
  number = digit+
  identifier = letter (alnum | "_" | space)* "?"?
  stringLiteral = "\"" (~"\"" any)* "\""

  // Lexical rules
  space += comment
  comment = "//" (~"\n" any)* "\n"  -- singleLine
          | "/*" (~"*/" any)* "*/"  -- multiLine
}
`);

const s = myGrammar.createSemantics();

s.addOperation('interpret', {
  Document(items) {
    // return items.children.map((item) => item.interpret());
    return items.interpret();
  },

  MetadataLine(_at, key, _eq, value) {
    return {
      type: 'metadata',
      key: key.interpret(),
      value: value.interpret(),
    };
  },

  Statement(left, _gt1, relation, _gt2, right) {
    // console.log('STATEMENT:', query.interpret()[0]);
    return {
      type: 'statement',
      // isQuery: !!query.interpret()[0],
      left: left.interpret(),
      relation: relation.interpret(),
      right: right.interpret(),
    };
  },

  // Query(_) {
  //   return true;
  // },

  Entity(e) {
    return e.interpret();
  },

  PlaceholderEntity(optNum, _dot, optName, optRole) {
    console.log('PlaceholderEntityNum:', optNum.sourceString);
    console.log('PlaceholderEntityName:', optName.sourceString);
    console.log('someshit');

    return {
      type: 'placeholder',
      number: !!optNum ? parseInt(optNum.sourceString, 10) : null,
      name: optName.interpret()[0].trim(),
    };
  },

  RegularEntity(num, dot, optName, optRole): RegularEntity {
    const entity: RegularEntity = {
      type: 'regular',
      uid: parseInt(num.sourceString, 10),
    };

    if (optName.children.length > 0) {
      entity.name = optName.interpret()[0].trim();
    }

    if (optRole.children.length > 0) {
      entity.role = optRole.interpret()[0].trim();
    }

    return entity;
  },

  Role(_colon, ident) {
    return ident.sourceString;
  },

  key(ident) {
    return ident.sourceString;
  },

  value(strLit) {
    return strLit.interpret();
  },

  number(_) {
    return this.sourceString;
  },

  identifier(_first, _rest, _optQ) {
    return this.sourceString;
  },

  stringLiteral(_open, chars, _close) {
    return chars.sourceString;
  },

  _terminal() {
    return this.sourceString;
  },

  _iter(...children) {
    return children.map((child) => child.interpret());
  },
});

// Helper function to parse and interpret Gellish input
function parseGellish(input) {
  const matchResult = myGrammar.match(input);
  if (matchResult.succeeded()) {
    console.log('Parsing succeeded');
    return s(matchResult).interpret();
  } else {
    throw new Error('Parsing failed: ' + matchResult.message);
  }
}

function itemUID(item) {
  if (item.type === 'regular') {
    return item.uid;
  } else if (item.type === 'placeholder') {
    return item.number;
  }
}

function itemRole(item) {
  if (item.type === 'regular') {
    return item.role;
  } else {
    return null;
  }
}

function itemString(item) {
  if (item.type === 'regular') {
    return item.name;
  } else if (item.type === 'placeholder') {
    return item.name;
  }
}

export class GellishParser {
  constructor() {}

  parse(queryString: string): any {
    console.log('GellishParser.parse');
    // queryStringArray.forEach((queryString) => {
    // const match = myGrammar.match(queryString);
    // if (match.succeeded()) {
    //   console.log('Match succeeded');
    //   console.log(match);
    //   console.log(match.succeeded());
    //   console.log(match.message);
    //   // console.log(match.startIdx);
    //   // console.log(match.endIdx);
    //   // console.log(match._cst);
    //   // console.log(match._cst.children);
    //   // console.log(match._cst.sourceString);
    //   // console.log(match._cst.source.contents);
    // } else {
    //   console.log('Match failed');
    //   console.log(match);
    //   console.log(match.succeeded());
    //   console.log(match.message);
    //   // console.log(match.startIdx);
    //   // console.log(match.endIdx);
    //   // console.log(match._cst);
    //   // console.log(match._cst.children);
    //   // console.log(match._cst.sourceString);
    //   // console.log(match._cst.source.contents);
    // }
    const result = parseGellish(queryString);

    console.log('Result:', result);

    const fact: Fact = {
      lh_object_uid: 0,
      lh_object_name: '',
      rel_type_uid: 0,
      rel_type_name: '',
      rh_object_uid: 0,
      rh_object_name: '',
      intention: 'assertion',
      fact_uid: 0,
    };

    result.forEach((item) => {
      // console.log('Item:', item);
      if (item.type === 'statement') {
        fact['lh_object_uid'] = itemUID(item.left);
        fact['lh_object_name'] = itemString(item.left);
        fact['rel_type_uid'] = itemUID(item.relation);
        fact['rel_type_name'] = itemString(item.relation);
        fact['rh_object_uid'] = itemUID(item.right);
        fact['rh_object_name'] = itemString(item.right);
        if (
          item.isQuery ||
          fact.lh_object_name === '?' ||
          fact.rh_object_name === '?'
        ) {
          fact['intention'] = 'question';
        }
      } else if (item.type === 'metadata') {
        fact[item.key] = item.value;
      }
    });

    // });
    return fact;
  }
}
