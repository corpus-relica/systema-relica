import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity.js';

export enum EntityFactEnum {
  ENTITY = 'ENTITY',
  FACT = 'FACT',
  NONE = 'NONE',
}

@Entity('user_environments')
@Index('unique_user_environment', ['userId'], { unique: true })
export class UserEnvironment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  @Index('idx_user_environments_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'selected_entity_id', type: 'bigint', nullable: true })
  selectedEntityId: number | null;

  @Column({
    name: 'selected_entity_type',
    type: 'enum',
    enum: EntityFactEnum,
    nullable: true,
  })
  selectedEntityType: EntityFactEnum | null;

  @Column({
    type: 'jsonb',
    default: '[]',
    name: 'facts',
  })
  @Index('idx_user_environments_facts', { spatial: true })
  facts: any[];

  @Column({
    type: 'jsonb',
    default: '[]',
    name: 'models',
  })
  @Index('idx_user_environments_models', { spatial: true })
  models: any[];

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'lisp_env',
  })
  lispEnv: any;

  @Column({
    name: 'last_accessed',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Index('idx_user_environments_last_accessed')
  lastAccessed: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
