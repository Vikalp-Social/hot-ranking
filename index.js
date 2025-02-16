import express from "express";
import axios from "axios";
import cors from "cors";
import bodyParser from "body-parser";
import statusMonitor from "express-status-monitor";

import accountsRouter from "./routers/accounts.js";
import authRouter from "./routers/auth.js";
import healthRouter from "./routers/health.js";
import registerRouter from "./routers/register.js";
import searchRouter from "./routers/search.js";
import statusesRouter from "./routers/statuses.js";
import tagsRouter from "./routers/tags.js";
import timelineRouter from "./routers/timeline.js";
import handleError from "./handleError.js";

import { DateTime } from 'luxon';

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

//middlewares
app.use(statusMonitor());
app.use(cors());
app.use(bodyParser.json());

/*override endpoints below here*/
//fetch home timeline 
app.get("/api/v1/timelines/home", async (req, res) => {

    try {
        const { uid, exp , last_db_update } = req.query;

        if (!uid)
        {
            console.log("uid is missing");
        }
        else if (!exp)
        {
            console.log("exp is missing");
        }
        else if(!last_db_update) {
            console.log("last_db_update is missing");
        }
        else if (!isWithinLastHour(last_db_update)){
            axios.post('https://auth.srg.social/api/v1/metric/log/activeUser', { last_db_update, uid, exp, algo: "hot" })
            .catch(() => {}); // Fire-and-forget

            console.log("Logged ", uid)
        }

    } catch (error) {
        console.log(error)
    }
    try {

        const { last_db_update } = req.query;
        
        const response = await axios.get(`https://${req.query.instance}/api/v1/timelines/home?limit=30`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`
            },
            params: {
                max_id: req.query.max_id,
            },
        });

        let update_last_db_update = {update_last_db_update : last_db_update == null ? true : !isWithinLastHour(last_db_update)};

        res.json({
            data: hotRanking(response.data),
            max_id: response.data[response.data.length - 1].id || '',
            update_last_db_update,
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
