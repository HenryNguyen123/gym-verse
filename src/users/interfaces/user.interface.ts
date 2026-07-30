export interface IUserPayload {
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
