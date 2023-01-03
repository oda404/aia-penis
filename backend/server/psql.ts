
import { DataSource } from "typeorm";
import { Container } from "typedi";
import { Admin } from "../models/admin";
import { Appointment } from "../models/appointment";
import { Review } from "../models/review";

const env = process.env.ENV!;
const psql_host = process.env.PSQL_HOST!;
const psql_port = process.env.PSQL_PORT!;
const psql_db = process.env.PSQL_DB!;
const psql_username = process.env.PSQL_USERNAME!;
const psql_pass = process.env.PSQL_PASS!;

export async function initPSQLConnection() {
    const dataSource = new DataSource({
        type: "postgres",
        applicationName: "exxpenses",

        host: psql_host,
        port: Number(psql_port),

        database: psql_db,
        username: psql_username,
        password: psql_pass,

        synchronize: env === "dev",
        logging: env === "dev",

        entities: [Admin, Appointment, Review]
    });

    console.log(`psql: Connecting to ${psql_host}:${psql_port}`);
    console.log(`psql: Connecting to database ${psql_db} as ${psql_username}`);
    console.log(`psql: Password length: ${psql_pass.length}, ending in "${psql_pass.substring(psql_pass.length - 3)}"`);

    await dataSource.initialize();

    Container.set('psqlDataSource', dataSource);
    Container.set('psqlAdminRepo', dataSource.getRepository(Admin));
    Container.set('psqlAppointmentRepo', dataSource.getRepository(Appointment));
    Container.set('psqlReviewRepo', dataSource.getRepository(Review));
}

export async function closePSQLConnection() {
    const dataSource = Container.get<DataSource>("psqlDataSource");

    /* Close connection */
    await dataSource.destroy();

    /* Remove from Container */
    Container.remove('psqlDataSource');
    Container.remove('psqlAdminRepo');
    Container.remove('psqlAppointmentRepo');
    Container.remove('psqlReviewRepo');
}

