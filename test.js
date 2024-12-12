import express from 'express';
import testRouter from './routers/testrouter.js';

const app = express();

app.get("/test/one", (req, res) => {
    res.send("two");
});

app.use("/test", testRouter);

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});