import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class ModelSession {
  @PrimaryColumn()
  uid: number;

  @Column('jsonb')
  state: Record<string, any>;

  // Optional: Add a getter method to parse the JSON if needed
  getState(): Record<string, any> {
    return typeof this.state === 'string' ? JSON.parse(this.state) : this.state;
  }

  // Optional: Add a setter method to ensure the state is stored as JSON
  setState(value: Record<string, any> | string): void {
    this.state = typeof value === 'string' ? JSON.parse(value) : value;
  }
}
