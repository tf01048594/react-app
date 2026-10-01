import "dotenv/config";

import express from "express";
import cors from "cors";
import helloRouter from "./routes/hello.route.js";
import settingRouter from "./routes/setting.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

const PORT = 3000;

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.use("/api/hello", helloRouter);

app.use("/api/settings", settingRouter);
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});