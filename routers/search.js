import express from 'express';
import axios from 'axios';
import handleError from '../handleError.js';
import authenticate from '../authenticate.js';

const searchRouter = express.Router();

//search 
searchRouter.get("/", authenticate, async (req, res) => {
    //console.log(req.body);
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v2/search`, {
            params: {
                q: req.query.q,
                //max_id: req.body.max_id,
            },
            headers: {
                Authorization: `Bearer ${req.token}`,
            },
        });
        //console.log(response.data.statuses.length)
        res.json({
            accounts: response.data.accounts,
            statuses: response.data.statuses,
            hashtags: response.data.hashtags,
            //max_id: response.data.statuses[response.data.statuses.length - 1].id,
        });
    } catch (error) {
        //console.log(error);;
        handleError(res, error)
    }
});

export default searchRouter;