import express from 'express';
import axios from 'axios';
import handleError from '../handleError.js';

const listsRouter = express.Router();

//fetch user lists
listsRouter.get("/", async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/lists`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//create a list
listsRouter.post("/", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.query.instance}/api/v1/lists`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        }    
    );
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//fetch a single list
listsRouter.get("/:id", async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/lists/${req.params.id}`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//fetch list members
listsRouter.get("/:id/accounts", async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/lists/${req.params.id}/accounts`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//add members to a list
listsRouter.post("/:id/accounts", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.query.instance}/api/v1/lists/${req.params.id}/accounts`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//remove members from a list
listsRouter.delete("/:id/accounts", async (req, res) => {
    try {
        const response = await axios.delete(`https://${req.query.instance}/api/v1/lists/${req.params.id}/accounts`, req.body,{
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//update a list
listsRouter.put("/:id", async (req, res) => {
    try {
        const response = await axios.put(`https://${req.query.instance}/api/v1/lists/${req.params.id}`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//delete a list
listsRouter.delete("/:id", async (req, res) => {
    try {
        const response = await axios.delete(`https://${req.query.instance}/api/v1/lists/${req.params.id}`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

export default listsRouter;