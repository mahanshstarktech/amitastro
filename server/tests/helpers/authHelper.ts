import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { securityService } from '../../src/services/securityService';

dotenv.config();

const getJwtSecret = () => process.env.JWT_SECRET || 'amitastro_secret_jwt_key_2026';

export interface AuthContext {
  token: string;
  csrfToken: string;
  cookieHeader: string[];
  authHeader: { Authorization: string };
  allHeaders: { Authorization: string; 'X-CSRF-TOKEN': string; Cookie: string };
}

export function generateAuthContextForUser(user: { id: string; role: string; email: string; name?: string }): AuthContext {
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name || 'User' },
    getJwtSecret(),
    { expiresIn: '30d' }
  );

  const csrfToken = securityService.generateCsrfToken();
  const cookies = [
    `amitastro_session=${token}`,
    `_zcsr_tmp=${csrfToken}`
  ];

  return {
    token,
    csrfToken,
    cookieHeader: cookies,
    authHeader: { Authorization: `Bearer ${token}` },
    allHeaders: {
      Authorization: `Bearer ${token}`,
      'X-CSRF-TOKEN': csrfToken,
      Cookie: cookies.join('; ')
    }
  };
}
