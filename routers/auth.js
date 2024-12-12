import express from 'express';
import axios from 'axios';
import handleError from '../handleError.js';
import {domain} from '../index.js';

const authRouter = express.Router();

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
        res.status(200).json({
            account: verify.data, 
            token: response.data.access_token
        });
        //console.log(verify.data);
    } catch (error) {
        //console.log(error);;
        handleError(res, error)
    }
})

export default authRouter;