import express from "express";
import axios from "axios";
import cors from "cors";
import bodyParser from "body-parser";
import statusMonitor from "express-status-monitor";
import cookieParser from "cookie-parser";
import { DateTime } from 'luxon';
import bcrypt from "bcryptjs";

import accountsRouter from "./routers/accounts.js";
import authRouter from "./routers/auth.js";
import healthRouter from "./routers/health.js";
import registerRouter from "./routers/register.js";
import searchRouter from "./routers/search.js";
import statusesRouter from "./routers/statuses.js";
import tagsRouter from "./routers/tags.js";
import timelineRouter from "./routers/timeline.js";
import handleError from "./handleError.js";
import authenticate from "./authenticate.js";

import serverlessExpress from "aws-serverless-express";

function score(date, likes, boosts){
    const d = new Date(date);
    const t = Math.floor(Math.abs(ref - d) / 1000);
    const x = likes + 2 * boosts;
    const y = x > 0 ? 1 : 0;
    const z = x >= 1 ? x : 1;
    return Math.log10(z) + (y * t / 45000);
}

function hotRanking(data){
    const statuses = data.map(status => {
        const s = status.reblog ? status.reblog : status;
        return {...status, score: score(s.created_at, s.favourites_count, s.reblogs_count)}
        
    });
    return statuses.sort((a, b) => b.score - a.score);
}

function isWithinLastHour(timestampStr) {

    const inputDate = DateTime.fromISO(timestampStr, { zone: "utc" });
    if (!inputDate.isValid) {
        console.log("Invalid datetime", timestampStr)
        return false;
    }

    const now = DateTime.utc();
    const oneHourAgo = now.minus({ hours: 1 });

    return inputDate >= oneHourAgo && inputDate <= now;
}

const app = express();
const port = process.env.PORT || 3000
const ref = new Date(1/1/1970);
export const domain = "https://srg.social";
const algo = "hot";

//middlewares
app.use(statusMonitor());
app.use(cookieParser());
app.use(cors({ origin: domain, credentials: true }));
app.use(bodyParser.json());

/*override endpoints below here*/
//fetch home timeline 
app.get("/api/v1/timelines/home", authenticate, async (req, res) => {
    try {
        const metrics_token = JSON.parse(req.cookies.metrics_token);
        console.log(metrics_token)
        const { uid, experience, lastDBUpdate, loginTime, algo } = metrics_token;

        if (!uid){
            console.log("uid is missing");
        }
        else if (!experience){
            console.log("exp is missing");
        }
        else if(!lastDBUpdate) {
            console.log("last_db_update is missing");
        }
        else if (!isWithinLastHour(lastDBUpdate)){
            const salt = bcrypt.genSaltSync(10);
            let hashedUid = bcrypt.hashSync(uid, salt);

            axios.post('https://auth.srg.social/api/v1/metric/log/activeUser', { lastDBUpdate, uid: hashedUid, exp: experience, algo })
            .catch(() => {}); // Fire-and-forget

            metrics_token.lastDBUpdate = DateTime.utc();

            res.cookie("metrics_token", JSON.stringify(metrics_token), {
                httpOnly: true, // Prevents JavaScript access
                secure: false, // Set to true in production (requires HTTPS)
                sameSite: "Strict", // Prevents CSRF
                maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
            });

            console.log("Logged ", uid)
        }

    } catch (error) {
        console.log(error)
    }
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/timelines/home?limit=30`, {
            headers: {
                Authorization: `Bearer ${req.token}`
            },
            params: {
                max_id: req.query.max_id,
            },
        });

        res.json({
            data: hotRanking(response.data),
            max_id: response.data[response.data.length - 1].id || '',
        })
        //res.json(response.data);
    } catch (error) {
        console.log(error)
        handleError(res, error)
    }
});

/*and above here */

//routes
app.use("/api/v1/accounts", accountsRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/register", registerRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/statuses", statusesRouter);
app.use("/api/v1/tags", tagsRouter);
app.use("/api/v1/timelines", timelineRouter);

const server = serverlessExpress.createServer(app);

export const handler = (event, context) => serverlessExpress.proxy(server, event, context)

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
