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
    dob?: Date;
    phone?: string;
    avatar?: string;
  };
}

export interface IPayloadJWTLogin {
  sub: number;
  roleCode: string[];
  permissionCodes: string[];
  iat?: number;
  exp?: number;
}
