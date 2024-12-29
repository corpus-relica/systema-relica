import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppState } from './appState.entity.js';

export enum State {
  REVIEW = 'REVIEW',
  MODELLING = 'MODELLING',
  SIMULATION = 'SIMULATION',
  ANALYSIS = 'ANALYSIS',
}

@Injectable()
export class StateService {
  private logger: Logger = new Logger('StateService');
  private state: any = { mainstate: State.REVIEW };

  async onApplicationBootstrap() {
    const state = await this.modelSessionRepository.find({
      where: { uid: 1 },
    });
    this.state = state[0].state;

    this.eventEmitter.emit('emit', {
      type: 'system:stateInitialized',
      payload: this.state,
    });
  }

  constructor(
    @InjectRepository(AppState)
    private modelSessionRepository: Repository<AppState>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getState() {
    return this.state;
  }

  async setState(newState: State) {
    this.state.mainstate = newState;

    const modelSession = await this.modelSessionRepository.find({
      where: { uid: 1 },
    });

    this.eventEmitter.emit('emit', {
      type: 'system:stateChanged',
      payload: this.state,
    });
  }
}
