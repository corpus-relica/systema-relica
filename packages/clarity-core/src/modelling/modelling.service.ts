import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModellingSession } from './modellingSession.entity';

export enum State {
  REVIEW = 'REVIEW',
  MODELLING = 'MODELLING',
  SIMULATION = 'SIMULATION',
  ANALYSIS = 'ANALYSIS',
}

@Injectable()
export class ModellingService {
  private logger: Logger = new Logger('ModellingService');
  private state: any = { mainstate: State.REVIEW };

  async onApplicationBootstrap() {
    const state = await this.modelSessionRepository.find({
      where: { uid: 1 },
    });
    this.state = state[0].state;

    // this.eventEmitter.emit('emit', {
    //   type: 'system:stateInitialized',
    //   payload: this.state,
    // });
  }

  constructor(
    @InjectRepository(ModellingSession)
    private modelSessionRepository: Repository<ModellingSession>,
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

    // this.eventEmitter.emit('emit', {
    //   type: 'system:stateChanged',
    //   payload: this.state,
    // });
  }
}
