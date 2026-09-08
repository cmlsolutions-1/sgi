export type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
  errors: Array<{ message?: string }> | null;
  meta: {
    path: string;
    method: string;
    timestamp: string;
    statusCode: number;
  };
};

export type CompanyLite = {
  id: string;
  name: string;
  nit?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  registrationDate?: string | null;
  createdAt?: string | null;
  status?: "ACTIVE" | "INACTIVE" | string | boolean | null;
};

export type CreateCompanyDto = {
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
};

export type UpdateCompanyDto = Partial<CreateCompanyDto>;

export type ChangeCompanyStatusDto = {
  status: "ACTIVE" | "INACTIVE";
};
