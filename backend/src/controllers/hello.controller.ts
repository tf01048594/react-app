import { Request, Response } from "express";
import { getHelloMessage } from "../services/hello.service.js";

export function getHello(req: Request, res: Response) {
  const message = getHelloMessage();

  res.json({
    message
  });
}

export function createHello(req: Request, res: Response) {
  const { name } = req.body;
  res.json({
    messages: `Hello, ${name}!`
  })
}