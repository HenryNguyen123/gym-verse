import { GenderEnum } from 'src/users/enums/profile.enum';

export interface IPayloadLogin {
  email: string;
  userName: string;
  isActive: boolean;
  role: {
    name: string;
    code: string;
  }[];
  profile: {
    fullName?: string;
    gender?: string;
    birthday?: Date;
    phone?: string;
    avatar?: string;
  };
}

export interface IPayloadJWTLogin {
  sub: number;
  roleCode: string[];
  // permissionCodes: string[];
  iat?: number;
  exp?: number;
}

export interface ILoginUser {
  id: number;
  email: string;
  userName: string;
  isActive?: boolean;
  roles: {
    name: string;
    code: string;
  }[];
  profile?: {
    fullName?: string;
    gender?: GenderEnum;
    birthday?: Date;
    phone?: string;
    avatar?: string;
  };
}
