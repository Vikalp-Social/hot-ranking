import express from 'express';
import axios from 'axios';
import handleError from '../handleError.js';

const statusesRouter = express.Router();

//post a status
statusesRouter.post("/", async (req, res) => {
    //console.log(req.body)
    try {
        const response = await axios.post(`https://${req.body.instance}/api/v1/statuses`, {
            status: req.body.message,
            media_ids: req.body.media_ids,
            in_reply_to_id: req.body.reply_id,
        }, {
            headers: {
                Authorization: `Bearer ${req.body.token}`,
            },
        });
        //console.log(response.data)
        res.status(200).json(response.data);
    } catch (error) {
        //console.log(error);
        handleError(res, error)
    }
});

//fetch a status
statusesRouter.get("/:id", async (req, res) => {
    try {
        const status = await axios.get(`https://${req.query.instance}/api/v1/statuses/${req.params.id}`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        const replies = await axios.get(`https://${req.query.instance}/api/v1/statuses/${req.params.id}/context`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json({
            status: status.data,
            replies: replies.data.descendants,
        });
    } catch (error) {
        //console.log(error.response.data);;
        handleError(res, error)
    }
});

//edit a status
statusesRouter.put("/:id", async (req, res) => {
    //console.log(req.body)
    try {
        const response = await axios.put(`https://${req.body.instance}/api/v1/statuses/${req.params.id}`, {status: req.body.text}, {
            headers: {
                Authorization: `Bearer ${req.body.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        //console.log(error);
        handleError(res, error)
    }
})

//favorite or unfavourite a status
statusesRouter.post("/:id/favourite", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.body.instance}/api/v1/statuses/${req.params.id}/${req.body.prefix}favourite`, {}, {
            headers: {
                Authorization: `Bearer ${req.body.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        //console.log(error.response.data);;
        handleError(res, error)
    }
});

//boost or unboost a status
statusesRouter.post("/:id/boost", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.body.instance}/api/v1/statuses/${req.params.id}/${req.body.prefix}reblog`, {}, {
            headers: {
                Authorization: `Bearer ${req.body.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        //console.log(error.response.data);;
        handleError(res, error)
    }
});

export default statusesRouter;