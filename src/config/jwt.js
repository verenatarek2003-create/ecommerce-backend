import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_env';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

