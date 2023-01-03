import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Review } from "./review";
import { USERNAME_LENGTH } from "./types";

@Entity({ name: "appointments" })
export class Appointment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: USERNAME_LENGTH })
    firstname: string;

    @Column({ length: USERNAME_LENGTH })
    lastname: string;

    @Column()
    email: string;

    @Column({ length: 10 })
    phone: string;

    @Column({ type: 'timestamptz' }) // Recommended
    date: Date;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: false })
    fulfilled: boolean;

    @OneToOne(() => Review)
    @JoinColumn()
    review: Review;
}
