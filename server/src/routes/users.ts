import { Router } from "express";
import { registerUser } from "../controller/user";

export const usersRouter = Router();

usersRouter.post('/register', registerUser);
