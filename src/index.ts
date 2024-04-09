import { config } from "dotenv";
import "advanced-logs";
import ExtendedClient from "./classes/extended-client";
import express from "express";

config();
const client = new ExtendedClient();
client.init();

// Create web server so hosting on Render.com doesn't fail.
const app = express();
app.get("/", (req, res) => res.json("OK"));
app.listen(10000);
