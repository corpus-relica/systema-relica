import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
// import { DSLParser } from '../dslvm/dsl-parser.service';
// import { VMExecutor } from '../dslvm/vm-executor.service';
import { REPLService } from 'src/repl/repl.service';
import {
  REPL_EVAL,
  SELECT_FACT,
  SELECT_ENTITY,
  SELECT_NONE,
  LOAD_SUBTYPES_CONE,
  LOAD_SPECIALIZATION_HIERARCHY,
  LOAD_ENTITY,
  UNLOAD_ENTITY,
  LOAD_ENTITIES,
  UNLOAD_ENTITIES,
  CLEAR_ENTITIES,
  LOAD_ALL_RELATED,
} from './actions';

@Injectable()
export class SemanticModelService {
  private logger: Logger = new Logger('SemanticModelService');
  private state = { count: 0 };

  constructor(private repl: REPLService) {}

  reducer(state, action) {
    let command;
    const { type, payload } = action;
    switch (type) {
      case REPL_EVAL:
        command = payload.command;
        break;
      /////////
      case SELECT_ENTITY:
        command = `(selectEntity ${payload.uid})`;
        break;
      case SELECT_FACT:
        command = `(selectFact ${payload.uid})`;
        break;
      case SELECT_NONE:
        command = `(selectNone)`;
        break;
      /////////
      case LOAD_ENTITY:
        command = `(loadEntity ${payload.uid})`;
        break;
      case UNLOAD_ENTITY:
        command = `(unloadEntity ${payload.uid})`;
        break;
      case LOAD_ENTITIES:
        const loadUidsStr = payload.uids.join(' ');
        command = `(loadEntities [${loadUidsStr}])])`;
        break;
      case UNLOAD_ENTITIES:
        const unloadUidsStr = payload.uids.join(' ');
        command = `(unloadEntities [${unloadUidsStr}])`;
        break;
      case CLEAR_ENTITIES:
        command = `(clearEntities)`;
        break;
      /////////
      case LOAD_SUBTYPES_CONE:
        command = `(loadSubtypesCone ${payload.uid}))`;
        break;
      case LOAD_SPECIALIZATION_HIERARCHY:
        this.logger.log('SEMANTIC MODEL :: LOAD_SPECIALIZATION_HIERARCHY');
        command = `
        (let* [result (getSpecializationHierarchy ${payload.uid})
               facts  (get result :facts )
               models (modelsFromFacts facts)
               payload {:facts facts :models models}]
          (do
            (insertFacts facts)
            (insertModels models)))
        `;
        break;
      case LOAD_ALL_RELATED:
        command = `
(let* [result (retrieveAllFacts ${payload.uid})
models (modelsFromFacts result)]
(do
  (insertFacts result)
  (insertModels models)))
`;
        break;
      default:
        this.logger.error('COMMAND UNKNOWN:', action.type);
        break;
    }
    this.repl.exec(command);
    return state;
  }

  dispatch(action: { type: string; payload: any }) {
    this.state = this.reducer(this.state, action);
    // this.listeners.forEach((listener) => listener());
  }
}
