import express from 'express';
import axios from 'axios';
import handleError from '../handleError.js';

const tagsRouter = express.Router();

//follow a tag
tagsRouter.post("/:name/follow", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.body.instance}/api/v1/tags/${req.params.name}/follow`, {}, {
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

tagsRouter.get("/following", async (req, res) => {
    console.log(req.query);
    try {
        const tags = await axios.get(`https://${req.query.instance}/api/v1/followed_tags`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(tags.data);
    } catch (error) {
        //console.log(error.response.data);;
        handleError(res, error)
    }
});

//unfollow a tag
tagsRouter.post("/:name/unfollow", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.body.instance}/api/v1/tags/${req.params.name}/unfollow`, {}, {
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

export default tagsRouter;