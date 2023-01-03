import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { USERNAME_LENGTH } from "./types";

@Entity({ name: "admins" })
export class Admin {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true, length: USERNAME_LENGTH })
    username: string;

    @Column()
    hash: string;

    @CreateDateColumn({ type: "timestamptz" })
    create_date: Date;
}
