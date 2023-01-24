import type { AuthRequest, AuthResponse, MeResponse } from "@/types";
import { HttpError } from "@/util/http-error";
import { authMessages } from "@/util/constants";
import { HttpStatus } from "@/util/http-status";
import { AuthInput, validateAuthInput } from "@/util/validators";
import { PrismaClient } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { Request, Router } from "express";
import { authMiddleware } from "@/middlewares/auth-middleware";

const router = Router();
const prisma = new PrismaClient();

router.post("/register", async (req: AuthRequest, res: AuthResponse, next) => {
  const input = req.body as AuthInput;

  const message = validateAuthInput(input);
  if (message) return next(new HttpError(HttpStatus.BAD_REQUEST, message));

  let user = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (user)
    return next(
      new HttpError(HttpStatus.BAD_REQUEST, authMessages.USERNAME_TAKEN)
    );

  const password = await hash(input.password, 10);
  user = await prisma.user.create({
    data: { username: input.username, password },
  });

  req.session!.username = user.username;
  return res.status(HttpStatus.CREATED).json({
    ok: true,
    message: authMessages.REGISTER_SUCCESS,
  });
});

router.post("/login", async (req: AuthRequest, res: AuthResponse, next) => {
  const input = req.body as AuthInput;

  const message = validateAuthInput(input);
  if (message) return next(new HttpError(HttpStatus.BAD_REQUEST, message));

  let user = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (!user)
    return next(
      new HttpError(HttpStatus.BAD_REQUEST, authMessages.USER_NOT_FOUND)
    );

  const valid = await compare(input.password, user.password);
  if (!valid)
    return next(
      new HttpError(HttpStatus.BAD_REQUEST, authMessages.USER_NOT_FOUND)
    );

  req.session!.username = user.username;
  return res.status(HttpStatus.OK).json({
    ok: true,
    message: authMessages.LOGIN_SUCCESS,
  });
});

router.get("/me", authMiddleware, async (req: Request, res: MeResponse) => {
  const user = req.user!;
  return res.status(HttpStatus.OK).json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
});

router.post("/logout", (req, res: AuthResponse) => {
  req.session = null;
  return res.status(HttpStatus.OK).json({
    ok: true,
    message: authMessages.LOGOUT_SUCCESS,
  });
});

export default router;
