const express = require("express");
const router = express.Router();
const jsonwebtoken = require('jsonwebtoken');


module.exports = () => {
    router.post("/JWT/", async (req, res) => {
        const {jwt} = req.body
        res.json(jsonwebtoken.decode(jwt));
    });
    return router
};
