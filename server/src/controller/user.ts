import { Request, Response } from 'express';
import { Users } from '../models/users';

export const registerUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const result = await Users.create({ username, password })
    res.status(201).json({ message: 'User registered successfully', userId: result.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}