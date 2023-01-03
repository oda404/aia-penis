
import express from "express";

async function main() {
    const app = express();

    app.use(express.static("public"))

    app.listen(3001);
}

main();
