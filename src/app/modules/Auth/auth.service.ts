import bcrypt from 'bcryptjs';
import db from '../../../shared/db';
import { ApiError } from '../../errors/ApiError';
import { generateToken } from '../../../helpers/jwtHelpers';

interface IStaffRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
}

export interface ILoginResult {
  accessToken: string;
  staff: {
    id: number;
    email: string;
    name: string;
  };
}

export const loginService = async (email: string, password: string): Promise<ILoginResult> => {
  const staff = await db<IStaffRow>('staff').where({ email }).first();

  if (!staff) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, staff.password_hash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const accessToken = generateToken({ id: staff.id, email: staff.email });

  return {
    accessToken,
    staff: {
      id: staff.id,
      email: staff.email,
      name: staff.name,
    },
  };
};
