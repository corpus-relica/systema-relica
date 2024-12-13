import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class EnvModel {
  @PrimaryColumn()
  uid: number;

  @Column()
  model: string;
}
