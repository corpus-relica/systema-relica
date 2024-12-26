import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum EntityFactEnum {
  NONE = 'none',
  ENTITY = 'entity',
  FACT = 'fact',
}

@Entity('env_selected_entity')
export class EnvSelectedEntity {
  @PrimaryColumn({ type: 'int4', default: 1 })
  id: number;

  @Column({ type: 'bigint', nullable: true, default: 0 })
  uid: string;

  @Column({
    type: 'enum',
    enum: EntityFactEnum,
    default: EntityFactEnum.NONE,
    nullable: false,
  })
  type: EntityFactEnum;
}
