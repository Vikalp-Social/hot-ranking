import express from 'express';
import axios from 'axios';
import pg from "pg";
import "dotenv/config";
import handleError from '../handleError.js';

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

db.connect();

const listsRouter = express.Router();

//fetch public lists
listsRouter.get("/public", async (req, res) => {
    try {
        const response = 1;
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

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
        });
        const query = await db.query("INSERT INTO lists(id, owner, name) VALUES($1, $2, $3) RETURNING *", [response.data.id, req.query.user, response.data.title]);
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
        const accounts = req.body.account_ids;
        accounts.forEach(account => {
            const query = db.query("INSERT INTO belongs_to(list_id, account_id) VALUES($1, $2) RETURNING *", [req.params.id, account]);
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//remove members from a list
listsRouter.delete("/:id/accounts", async (req, res) => {
    try {
        console.log(req.query);
        const body = {
            account_ids: req.query.account_ids
        }
        const response = await axios.delete(`https://${req.query.instance}/api/v1/lists/${req.params.id}/accounts`, body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        const accounts = req.query.account_ids;
        accounts.forEach(account => {
            const query = db.query("DELETE FROM belongs_to WHERE list_id = $1 AND account_id = $2", [req.params.id, account]);
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
        const query = await db.query("UPDATE lists SET name = $1 WHERE id = $2 RETURNING *", [req.body.title, req.params.id]);
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
        const query = await db.query("DELETE FROM lists WHERE id = $1", [req.params.id]);
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

export default listsRouter;