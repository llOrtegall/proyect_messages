import { registerUser, loginUser, userProfile, logoutUser } from "../controller/user";
import { Router } from "express";

export const usersRouter = Router();

usersRouter.post('/register', registerUser);

usersRouter.post('/login', loginUser);

usersRouter.get('/profile', userProfile);

usersRouter.get('/logout', logoutUser);
