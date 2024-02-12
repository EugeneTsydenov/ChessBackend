import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from "./routes";
import { errorMiddleware } from "./middlewares/error-middleware";
import {Server} from "colyseus";
import {createServer} from "node:http";

export const app: Express = express();

dotenv.config();
const PORT = Number(process.env.BASE_PORT) || 52718;

app.use(express.json());
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL
}));
app.use(cookieParser());
app.use('/api', router);
app.use(errorMiddleware);

const gameServer = new Server({
  server: createServer(app)
})

gameServer.listen(PORT).then(() => {
  console.log(`Server started on ${PORT} port.`)
})