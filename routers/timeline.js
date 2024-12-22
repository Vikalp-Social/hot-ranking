import express from 'express';
import axios from 'axios';
import handleError from '../handleError.js';

const timelineRouter = express.Router();

//fetch tag timeline
timelineRouter.get("/tag/:name", async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/timelines/tag/${req.params.name}?limit=20`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
            params: {
                max_id: req.query.max_id,
            },
        });
        res.json({
            data: response.data,
            max_id: response.data[response.data.length - 1].id,
        });
    } catch (error) {
        //console.log(error.response.data);;
        handleError(res, error)
    }
})

//fetch home timeline 
timelineRouter.get("/home", async (req, res) => {
    //console.log(req.query);
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/timelines/home?limit=30`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`
            },
            params: {
                max_id: req.query.max_id,
            },
        });
        res.json({
            data: response.data,
            max_id: response.data[response.data.length - 1].id || '',
        })
        //res.json(response.data);
    } catch (error) {
        console.log(error)
        handleError(res, error)
    }
});

//fetch list timeline
timelineRouter.get("/lists/:id", async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/timelines/list/${req.params.id}?limit=20`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
            params: {
                max_id: req.query.max_id,
            },
        });
        res.json({
            data: response.data,
            max_id: response.data.length? response.data[response.data.length - 1] : "",
        });
    } catch (error) {
        console.log(error);
        handleError(res, error)
    }
})

export default timelineRouter;