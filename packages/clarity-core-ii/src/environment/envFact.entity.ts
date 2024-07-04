import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EnvFact {
    @PrimaryGeneratedColumn()
    uid: number;

    @Column('jsonb')
    fact: Record<string, any>;

    // Optional: Add a getter method to parse the JSON if needed
    getFact(): Record<string, any> {
        return typeof this.fact === 'string'
            ? JSON.parse(this.fact)
            : this.fact;
    }

    // Optional: Add a setter method to ensure the fact is stored as JSON
    setFact(value: Record<string, any> | string): void {
        this.fact = typeof value === 'string' ? JSON.parse(value) : value;
    }
}
