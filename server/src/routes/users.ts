import { registerUser, userProfile } from "../controller/user";
import { Router } from "express";

export const usersRouter = Router();

usersRouter.post('/register', registerUser);

usersRouter.get('/profile', userProfile);