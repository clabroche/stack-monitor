const express = require("express");
const router = express.Router();
const { ObjectId } = require('mongodb')

router.get("/mongo/generate", async (req, res) => {
    res.json(new ObjectId());
});

module.exports = () => router
