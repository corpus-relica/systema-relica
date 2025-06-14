import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('environments')
export class Environment {
  @ApiProperty({ description: 'Unique identifier for the environment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the environment' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'User ID who owns this environment' })
  @Column({ name: 'user_id', length: 255 })
  userId: string;

  @ApiProperty({ description: 'Currently selected entity UID in this environment' })
  @Column({ name: 'selected_entity_id', nullable: true })
  selectedEntityId?: string;

  @ApiProperty({ description: 'Facts stored in this environment', type: 'array' })
  @Column({ type: 'jsonb', default: [] })
  facts: any[];

  @ApiProperty({ description: 'Environment creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Environment last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}