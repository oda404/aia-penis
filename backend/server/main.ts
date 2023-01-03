
import express from "express";
import session from "express-session";
import { readFileSync } from "fs";
import { exit } from "process";
import cors = require("cors");
import { Server as HTTPServer } from "http";
import { Server as HTTPSServer } from "https";
import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import connectRedis from "connect-redis";
const RedisStore = connectRedis(session);
import { Container } from "typedi";
import Redis from "ioredis";
import { initPSQLConnection, closePSQLConnection } from "./psql";
import { initRedisConnection, closeRedisConnection } from "./redis";
import { noReplyMailer } from "./mailer";
import { useRESTAPI } from "../rest/routes";
import { json as jsonParser } from "body-parser";

const env = process.env.ENV!;

const server_bind_address = process.env.SERVER_BIND_ADDRESS!;
const server_bind_port = process.env.SERVER_BIND_PORT!;
const frontend_url = process.env.FRONTEND_URL!;

const session_domain = process.env.SESSION_DOMAIN;
const session_secret = process.env.SESSION_SECRET!;

const https_key_path = process.env.HTTPS_KEY_PATH!;
const https_cert_path = process.env.HTTPS_CERT_PATH!;

async function new_redis_store() {
    return new RedisStore({
        client: Container.get<Redis>("redisClient"),
    });
}

async function new_http_server() {

    console.log(`session: domain: ${session_domain}`);
    console.log(`session: secret length: ${session_secret.length}`);

    if (env === "prod" && session_secret.length < 128) {
        console.log("Server started in production mode but session secret is shorter than 128 characters!");
        exit(1);
    }

    /* Creat express server */
    const app = express();
    const redisStore = await new_redis_store();

    app.use(cors({
        origin: frontend_url,
        credentials: true
    }));

    /* Cookies middleware */
    app.use(session({
        name: "admin_session",
        store: redisStore,
        cookie: {
            path: "/",
            httpOnly: true,
            secure: env === "prod",
            maxAge: 1000 * 60 * 60 * 24 * 4, // 4 days
            sameSite: "lax",
            domain: session_domain
        },
        secret: session_secret,
        resave: false,
        saveUninitialized: false,
    }));

    /* Cumplit */
    app.use(jsonParser());

    useRESTAPI(app);

    let server: HTTPServer | HTTPSServer;


    server = createHttpServer(app);

    return server;
}

async function main() {

    console.log(`server: Environment is ${env}`);
    console.log(`server: Serving frontend ${frontend_url}`);

    /* Initialize the connection to Postgresql */
    await initPSQLConnection();

    /* Initialize connection to Redis server */
    await initRedisConnection();

    const server = await new_http_server();

    const port_number = Number(server_bind_port);
    server.listen(port_number, server_bind_address, () => {
        console.log(`server: Listening on ${server_bind_address}:${port_number}`);
    });

    process.on("SIGINT", () => {
        server.close(async () => {
            await closePSQLConnection();
            await closeRedisConnection();
            noReplyMailer.close();
            exit(1);
        })
    })
}

main();
