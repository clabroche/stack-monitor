const express = require("express");
const router = express.Router();
const jsonwebtoken = require('jsonwebtoken');

router.post("/", async (req, res) => {
    const {jwt} = req.body
    res.json(jsonwebtoken.decode(jwt));
});

module.exports = router;
