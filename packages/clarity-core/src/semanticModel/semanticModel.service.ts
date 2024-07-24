import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { DSLParser } from '../dslvm/dsl-parser.service';
import { VMExecutor } from '../dslvm/vm-executor.service';

@Injectable()
export class SemanticModelService {
  private logger: Logger = new Logger('SemanticModelService');
  private state = { count: 0 };

  constructor() {}

  reducer(state, action) {
    switch (action.type) {
      case 'INCREMENT':
        return { count: state.count + 1 };
      case 'DECREMENT':
        return { count: state.count - 1 };
      default:
        return state;
    }
  }

  dispatch(action) {
    this.state = this.reducer(this.state, action);
    // this.listeners.forEach((listener) => listener());
  }
}
