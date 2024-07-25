import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
// import { DSLParser } from '../dslvm/dsl-parser.service';
// import { VMExecutor } from '../dslvm/vm-executor.service';
import { REPLService } from 'src/repl/repl.service';
import {
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
    switch (action.type) {
      /////////
      case SELECT_ENTITY:
        command = `
        (do
          (selectEntity ${action.payload.uid})
          (emit \"system:selectedEntity\" {:uid ${action.payload.uid}}))
        `;
        break;
      case SELECT_FACT:
        command = `
        (do
          (selectFact ${action.payload.uid})
          (emit \"system:selectedFact\" {:uid ${action.payload.uid}}))
        `;
        break;
      case SELECT_NONE:
        command = `
        (do
          (selectNone)
          (emit \"system:selectedNone\" {}))
        `;
        break;
      /////////
      case LOAD_ENTITY:
        command = `
(let* [result (loadEntity ${action.payload.uid})]
(emit \"system:loadedFacts\" result))
`;
        break;
      case UNLOAD_ENTITY:
        command = `
        (let* [result (unloadEntity ${action.payload.uid})]
(emit \"system:unloadedFacts\" {:fact_uids result}))
        `;
        break;
      case LOAD_ENTITIES:
        const loadUidsStr = action.payload.uids.join(' ');
        command = `
        (let* [result (loadEntities [${loadUidsStr}])]
(emit \"system:loadedFacts\" result))`;
        break;
      case UNLOAD_ENTITIES:
        const unloadUidsStr = action.payload.uids.join(' ');
        console.log('UNLOAD_ENTITIES', unloadUidsStr);
        command = `
        (let* [result (unloadEntities [${unloadUidsStr}])]
(emit \"system:unloadedFacts\" {:fact_uids result}))`;
        break;
      case CLEAR_ENTITIES:
        command = `
(do
(clearEntities)
(emit \"system:entitiesCleared\" {}))`;
        break;
      /////////
      case LOAD_SUBTYPES_CONE:
        command = `
(let* [result (loadSubtypesCone ${action.payload.uid})]
(emit \"system:loadedFacts\" result))`;
        break;
      case LOAD_SPECIALIZATION_HIERARCHY:
        this.logger.log('SEMANTIC MODEL :: LOAD_SPECIALIZATION_HIERARCHY');
        command = `
        (let* [result (getSpecializationHierarchy ${action.payload.uid})
               facts  (get result :facts )
               models (modelsFromFacts facts)
               payload {:facts facts :models models}]
          (do
            (insertFacts facts)
            (insertModels models)
            (emit \"system:loadedFacts\" payload))))
        `;
        break;
      case LOAD_ALL_RELATED:
        command = `
(let* [result (retrieveAllFacts ${action.payload.uid})
models (modelsFromFacts result)]
(do
  (insertFacts result)
  (insertModels models)
(emit \"system:loadedFacts\" {:facts result :models models})))
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
