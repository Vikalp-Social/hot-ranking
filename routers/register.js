import express from 'express';
import axios from 'axios';
import {domain} from '../index.js';

const registerRouter = express.Router();

//register app
registerRouter.post("/", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.body.instance}/api/v1/apps`, {
            client_name: "Vikalp",
            redirect_uris: `${domain}/auth`,
            scopes: "read write push",
            website: `${domain}`,
        });
        res.status(200).json(response.data);
    } catch (error) {
        //console.log("sent");
        if(error.code === 'ENOTFOUND'){
            res.status(502).json({
                error: "Instance not found",
                status: 404,
                statusText: "Not Found",
            });
        } else {
            res.status(400).json({
                error: error.response.data.error,
                status: error.response.status,
                statusText: error.response.statusText,
            });
        }
    }
})

export default registerRouter;