import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EnvModel {
  @PrimaryGeneratedColumn()
  uid: number;

  @Column()
  model: string;
}
