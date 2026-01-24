//interfaces/auth.interface.ts

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
