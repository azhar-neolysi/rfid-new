import { BaseEntity } from './base.model';

export interface User extends BaseEntity {
  userId: number;
  refOrgid: string | null;
  userName: string | null;
  email: string | null;
  mobileNo: string | null;
  password: string | null;
  processing: string | null;
  comments: string | null;
  passwordHash: string | null;
  passwordSalt: string | null;
  emailVerified: string | null;
}
