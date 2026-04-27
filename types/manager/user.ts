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
  companyId: string
};

export type CreateCompanyAdminDto = {
  name: string
  email: string
  phone: string
  password: string
}

export type UpdateUserDto = Partial<Omit<CreateUserDto, "password" | "rolesIds">> & {
  password?: string;
  rolesIds?: string[];
};

export type CreateCompanyAdminResponse = {
  company: {
    id: string
    name: string
  }
  role: {
    id: string
    name: string
  }
  parentModulesEnabled: number
  parentModulesUsed: number
  childModulesConsidered: number
  permissionsAssigned: number
  user: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export type UserResponse = ApiResponse<User>;
export type UsersResponse = ApiResponse<User[]>;
export type CreateCompanyAdminApiResponse = ApiResponse<CreateCompanyAdminResponse>