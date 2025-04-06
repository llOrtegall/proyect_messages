import { JWT_SECRET } from '../schemas/envSchema';
import { Request, Response } from 'express';
import { Users } from '../models/users';
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    await Users.sync();

    const result = await Users.create({ username, password })

    if (!result) {
      res.status(400).json({ message: 'User registration failed' });
    }
    // Generate a JWT token
    jwt.sign({ id: result.id }, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        res.status(500).json({ message: 'Error generating token' });
      }
      // Send the token as a response
      res.json({ token });
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}