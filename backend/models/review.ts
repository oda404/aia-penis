import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from "typeorm";
import { Appointment } from "./appointment";

@Entity({ name: "reviews" })
export class Review {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    stars: number;

    @Column({ nullable: true })
    description?: string;

    @CreateDateColumn({ type: "timestamptz" })
    create_date: Date;
}
