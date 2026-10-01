import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      errors: err.issues
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
          res.status(409).json({
              message: "A record with this value already exists"
          });
          return;
      }

      if (err.code === "P2025") {
          res.status(404).json({
              message: "Record not found"
          });
          return;
      }
  }

  console.error(err);

  res.status(500).json({
    message: "Internal server error"
  });
}
