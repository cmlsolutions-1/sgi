// types/manager/user.ts
import type { ApiResponse } from "./company";

export type UserStatus = "ACTIVE" | "INACTIVE";

export type Role = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  status: UserStatus;
  companyId: string;
  roles: Role[];
};

export type CreateUserDto = {
  name: string;
  email: string;
  phone: string;
  password: string;
  rolesIds: string[];
};

export type UpdateUserDto = Partial<Omit<CreateUserDto, "password" | "rolesIds">> & {
  password?: string;
  rolesIds?: string[];
};

export type UserResponse = ApiResponse<User>;
export type UsersResponse = ApiResponse<User[]>;