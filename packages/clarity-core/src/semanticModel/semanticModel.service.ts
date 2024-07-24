import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
// import { DSLParser } from '../dslvm/dsl-parser.service';
// import { VMExecutor } from '../dslvm/vm-executor.service';
import { REPLService } from 'src/repl/repl.service';
import { LOAD_SPECIALIZATION_HIERARCHY } from './actions';

@Injectable()
export class SemanticModelService {
  private logger: Logger = new Logger('SemanticModelService');
  private state = { count: 0 };

  constructor(private repl: REPLService) {}

  reducer(state, action) {
    let command;
    switch (action.type) {
      case LOAD_SPECIALIZATION_HIERARCHY:
        this.logger.log('SEMANTIC MODEL :: LOAD_SPECIALIZATION_HIERARCHY');
        //         command = `
        // (let (result (getSpecializationHierarchy ${action.payload.uid})
        //       facts  (:facts result)
        //       models (modelsFromFacts facts)
        //       payload (:facts facts :models models)
        //   (insertFacts facts)
        //   (insertModels models)
        //   (emit 'system:addFacts' payload)))
        // `;
        command = `(/ 8 (- 12 3) (+ 1 2) (* 2 3))`;
        break;
      case 'DECREMENT':
        break;
      default:
        break;
    }
    // VMExecutor.execute(DSLParser.parse(command));
    this.repl.exec(command);
    return state;
  }

  dispatch(action: { type: string; payload: any }) {
    this.state = this.reducer(this.state, action);
    // this.listeners.forEach((listener) => listener());
  }
}
