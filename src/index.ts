import { config } from "dotenv";
import "advanced-logs";
import ExtendedClient from "./classes/extended-client";

config();
const client = new ExtendedClient();
client.init();
