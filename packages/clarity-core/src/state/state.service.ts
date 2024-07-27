import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

enum State {
  REVIEW = 'REVIEW',
  MODELLING = 'MODELLING',
  SIMULATION = 'SIMULATION',
  ANALYSIS = 'ANALYSIS',
}

@Injectable()
export class StateService {
  private logger: Logger = new Logger('StateService');
  private state = { mainstate: State.REVIEW };

  constructor(private readonly eventEmitter: EventEmitter2) {}

  getState() {
    return this.state;
  }

  setState(newState: State) {
    this.state.mainstate = newState;
    this.eventEmitter.emit('emit', {
      type: 'system:stateChanged',
      payload: this.state,
    });
  }
}
