const express = require("express");
const app = express();
const shortenRoutes = require("./routes/shorten");

app.use(express.json());
app.use(shortenRoutes); // Register the routes
