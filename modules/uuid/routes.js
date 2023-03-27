const express = require("express");
const router = express.Router();
const {v4} = require('uuid')

router.get("/", async (req, res) => {
    res.json(v4());
});

module.exports = router;
