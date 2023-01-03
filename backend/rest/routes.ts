
import { Request, Response, Express } from "express";
import { Container } from "typedi";
import { Repository } from "typeorm";
import { Admin } from "../models/admin";
import { Appointment } from "../models/appointment";
import { Review } from "../models/review";
import { noReplyMailer } from "../server/mailer";
import { hash as argon2_hash, verify as argon2_verify } from "argon2";

const frontend_url = process.env.FRONTEND_URL!;

declare module 'express-session' {
    interface SessionData {
        userId: string;
    }
}

/* All business logic in a single file cuz I m a dipshit :) */

async function addAppointment(req: Request, res: Response) {
    const appointmentRepo = Container.get<Repository<Appointment>>('psqlAppointmentRepo');

    if (req.body.firstname.length > 100)
        return;

    if (req.body.lastname.length > 100)
        return;

    if (req.body.email.length > 100)
        return;

    if (req.body.phone.length > 100)
        return;

    if (req.body.date.length > 100)
        return;

    const appointment: Partial<Appointment> = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone,
        date: req.body.date
    };

    try {
        const resp = await appointmentRepo.save(appointment);
    }
    catch (e) {
        res.status(500).send("dang");
        return;
    }

    const date = new Date(req.body.date);

    noReplyMailer.sendMail({
        from: "tln <no-reply@tln.ro>",
        to: req.body.email,
        subject: "Confirmare programare",
        text: `Buna ziua ${req.body.lastname}, va multumim pentru programarea facuta!`,
        html: `
            <div>
                <div>Buna ziua ${req.body.lastname}, va multumim pentru programarea facuta!</div>
                <div>Va asteptam in data de ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} la ora ${date.getHours()}:${date.getMinutes()} in sediul nostru!</div>
                <div>O zi frumoasa! - Echipa TLN</div>
            </div>
        `
    });

    res.send(req.body);
}

async function loginAdmin(req: Request, res: Response) {

    const username = req.body.username;
    const pass = req.body.password;

    const adminRepo = Container.get<Repository<Admin>>('psqlAdminRepo');

    const admin = await adminRepo.findOneBy({ username: username });
    if (!admin) {
        res.status(400).send("No dice");
        return;
    }

    if (!await argon2_verify(admin.hash, pass)) {
        res.status(400).send("No dice");
        return;
    }

    req.session.userId = admin.id;

    res.send("OK");
}

async function getAdmin(req: Request, res: Response) {
    if (req.session.userId === undefined) {
        res.status(400).send("Not logged in");
        return;
    }

    const adminRepo = Container.get<Repository<Admin>>('psqlAdminRepo');

    let admin = await adminRepo.findOneBy({ id: req.session.userId });
    if (!admin) {
        res.clearCookie("admin_session");
        req.session.destroy(() => { });
        res.status(500).send("No admin");
        return;
    }

    res.json({ username: admin!.username });
}

async function getAppointments(req: Request, res: Response) {
    if (req.session.userId === undefined) {
        res.status(400).send("Not logged in");
        return;
    }

    const adminRepo = Container.get<Repository<Admin>>('psqlAdminRepo');
    const admin = await adminRepo.findOneBy({ id: req.session.userId });
    if (!admin) {
        res.clearCookie("admin_session");
        req.session.destroy(() => { })
        res.status(400).send("Dang");
        return;
    }

    const appointmentRepo = Container.get<Repository<Appointment>>('psqlAppointmentRepo');

    try {
        const appointments = await appointmentRepo.find({ relations: ["review"] });
        res.json(appointments);
    } catch (e) {
        res.status(500).send("Dang");
    }
}

async function appointmentDone(req: Request, res: Response) {
    if (req.session.userId === undefined) {
        res.status(400).send("Not logged in");
        return;
    }

    const adminRepo = Container.get<Repository<Admin>>('psqlAdminRepo');
    const admin = await adminRepo.findOneBy({ id: req.session.userId });
    if (!admin) {
        res.clearCookie("admin_session");
        req.session.destroy(() => { })
        res.status(400).send("Dang");
        return;
    }

    const appointmentRepo = Container.get<Repository<Appointment>>('psqlAppointmentRepo');
    const appId = req.body.id;

    try {
        let app = await appointmentRepo.findOneBy({ id: appId });
        if (!app) {
            res.status(500).send("Dang");
            return;
        }

        await appointmentRepo.update({ id: appId }, { fulfilled: true });

        noReplyMailer.sendMail({
            from: "tln <no-reply@tln.ro>",
            to: app.email,
            subject: "Imbunatatiri servicii",
            text: `Buna ziua ${app.lastname}, va multumim pentru ca ne-ati ales!`,
            html: `
                <div>
                    <div>Buna ziua ${app.lastname}, va multumim ca ne-ati ales!</div>
                    <div>Va rugam sa ne acordati 2 minute pentru a ne spune cum ne putem imbunatatii serviciile: </div>
                    <a href="${frontend_url}/review.html?id=${appId}">Review</a>
                    <div>O zi frumoasa! - Echipa TLN</div>
                </div>
            `
        });

        res.send("ok");
    }
    catch (e) {
        res.status(500).send("Dang");
    }
}

async function addReview(req: Request, res: Response) {
    const appId = req.body.id;
    const stars = req.body.stars;
    const desc = req.body.desc;

    if (desc.length > 100)
        return;

    const appointmentRepo = Container.get<Repository<Appointment>>('psqlAppointmentRepo');
    const reviewRepo = Container.get<Repository<Appointment>>('psqlReviewRepo');

    let app = await appointmentRepo.findOneBy({ id: appId });
    if (!app) {
        res.send(400).send("Dang");
        return;
    }

    const partreview: Partial<Review> = {
        stars: stars,
        description: desc
    };
    const review = await reviewRepo.save(partreview);

    await appointmentRepo.update({ id: app.id }, { review: review });

    res.send("OK");
}

async function hasReview(req: Request, res: Response) {
    const appId = req.body.id;

    const appointmentRepo = Container.get<Repository<Appointment>>('psqlAppointmentRepo');

    const app = await appointmentRepo.findOne({
        where: { id: appId },
        relations: ["review"]
    });
    if (!app || !app.review) {
        res.status(400).end("Dang");
        return;
    }

    res.send("OK");
}

async function addBaseAdmin() {
    const adminRepo = Container.get<Repository<Admin>>('psqlAdminRepo');

    const admin = await adminRepo.findOneBy({ username: "tln" })
    if (!admin) {
        const partadmin: Partial<Admin> = {
            username: "tln",
            hash: await argon2_hash("penis")
        };
        await adminRepo.save(partadmin);
    }
}

export function useRESTAPI(app: Express) {
    addBaseAdmin();
    app.post("/appointment", addAppointment);
    app.post("/admin-session", loginAdmin);
    app.post("/appointment-done", appointmentDone);
    app.post("/review-add", addReview);
    app.get("/admin", getAdmin);
    app.get("/appointments", getAppointments);
    app.post("/review-has", hasReview);
}
