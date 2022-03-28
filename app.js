const express = require("express");
const { getTopics } = require("./controller/app.controller");

const app = express();

app.use(express.json());

app.get("/api/topics", getTopics);

module.exports = app;