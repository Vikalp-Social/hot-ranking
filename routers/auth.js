import express from 'express';
import axios from 'axios';
import handleError from '../handleError.js';
import {domain} from '../index.js';
import cors from "cors";
import jwt from "jsonwebtoken"

const authRouter = express.Router();
const algo = "hot";
const SECRET_KEY = "your_secret_key";

//authenticate user
authRouter.post("/", async(req, res) => {
    //console.log(req.body);
    try {
        const response = await axios.post(`https://${req.body.instance}/oauth/token`, {
            client_id: req.body.id,
            client_secret: req.body.secret,
            redirect_uri: `${domain}/auth`,
            grant_type: "authorization_code",
            code: req.body.code,
            scope: "read write push",
        });
        const verify = await axios.get(`https://${req.body.instance}/api/v1/accounts/verify_credentials`, {
            headers: {
                Authorization: `Bearer ${response.data.access_token}`,
            }
        });
        console.log("verified");

        const tokenPayload = {
            uid: verify.data.id,
            experience: req.body.exp,
            lastDBUpdate: Date.now(),
            loginTime: Date.now(),
            algo,
        };

        const jwtToken = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "1h" });

        // Set the token as an HTTP-only cookie
        res.cookie("auth_token", jwtToken, {
            httpOnly: true, // Prevents JavaScript access
            secure: false, // Set to true in production (requires HTTPS)
            sameSite: "Strict", // Prevents CSRF
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        res.cookie("access_token", response.data.access_token, {
            httpOnly: true,  // Prevents JavaScript access
            secure: false,   // Set to true in production (requires HTTPS)
            sameSite: "Strict", // Prevents CSRF attacks
            maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
        });

        res.status(200).json({
            account: verify.data,
        });
        //console.log(verify.data);
    } catch (error) {
        // console.log(error);
        handleError(res, error)
    }
})

export default authRouter;