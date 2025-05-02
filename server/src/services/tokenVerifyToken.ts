import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../schemas/envSchema';

interface UserInfoToken extends JwtPayload {
    id: string;
    username: string;
}

export const verifyToken = (token: string): Promise<UserInfoToken | undefined> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.message === 'jwt expired') {
          reject(new Error('TOKEN_EXPIRED'));
          return;
        } else {
          reject(new Error('INVALID_TOKEN'));
          return;
        }
      } else {
        resolve(decoded as UserInfoToken);
      }
    });
  });
};