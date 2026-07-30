export interface IJwtPayload {
  roleCode: string;
  email: string;
  sub: number;
  iat: number;
  exp: number;
}
