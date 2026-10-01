import { Router } from "express";
import { createHello, getHello } from "../controllers/hello.controller.js";

const router = Router();

router.get("/", getHello);

router.post("/", createHello);

export default router;