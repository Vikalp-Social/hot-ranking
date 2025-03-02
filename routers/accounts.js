import express from 'express';
import axios from 'axios';
import handleError from '../handleError.js';
import authenticate from '../authenticate.js';

const accountsRouter = express.Router();

//fetch user account data
accountsRouter.get("/:id", authenticate, async (req, res) => {
    try {
        const account = await axios.get(`https://${req.query.instance}/api/v1/accounts/${req.params.id}`);
        const statuses = await axios.get(`https://${req.query.instance}/api/v1/accounts/${req.params.id}/statuses`, {
            headers: {
                Authorization: `Bearer ${req.token}`,
            },
            params: {
                max_id: req.query.max_id
            }
        }
        );
        //console.log(statuses.data);
        res.status(200).json({
            status: "Success",
            account: account.data,
            statuses: {
                count: statuses.data.length,
                list: statuses.data || [],
                max_id: statuses.data[statuses.data.length - 1]?.id || -1, 
            },
        });
    } catch (error) {
        //console.log(error)
        //console.log(error.response.data);;
        handleError(res, error)
    }
});

//edit user profile
accountsRouter.patch("/", authenticate, async (req, res) => {
    //console.log(req.body);
    try {
        const response = await axios.patch(`https://${req.body.instance}/api/v1/accounts/update_credentials`, {
            display_name: req.body.display_name,
            note: req.body.note,
        }, 
        {
            headers: {
                Authorization: `Bearer ${req.token}`
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        //console.log(error);
        handleError(res, error)
    }
});

//fetch user followers
accountsRouter.get("/:id/followers", authenticate, async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/accounts/${req.params.id}/followers`, {
            headers: {
                Authorization: `Bearer ${req.token}`,
            },
            params: {
                max_id: req.query.max_id,
            },
        });
        res.json({
            accounts: response.data,
            max_id: response.data[response.data.length - 1].id,
        });
    } catch (error) {
        //console.log(error);;
        handleError(res, error)
    }
});

//fetch user following
accountsRouter.get("/:id/following", authenticate, async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/accounts/${req.params.id}/following`, {
            headers: {
                Authorization: `Bearer ${req.token}`,
            },
            params: {
                max_id: req.query.max_id,
            },
        });
        res.json({
            accounts: response.data,
            max_id: response.data[response.data.length - 1].id,
        });
    } catch (error) {
        //console.log(error);;
        handleError(res, error)
    }
});

//follow a user
accountsRouter.post("/:id/follow", authenticate, async (req, res) => {
    try {
        const response = await axios.post(`https://${req.body.instance}/api/v1/accounts/${req.params.id}/follow`, {}, {
            headers: {
                Authorization: `Bearer ${req.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
    // console.log(error.response.data);;
        handleError(res, error)
    }
});

//unfollow a user
accountsRouter.post("/:id/unfollow", authenticate, async (req, res) => {
    try {
        const response = await axios.post(`https://${req.body.instance}/api/v1/accounts/${req.params.id}/unfollow`, {}, {
            headers: {
                Authorization: `Bearer ${req.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        //console.log(error.response.data);;
        handleError(res, error)
    }
});

export default accountsRouter;