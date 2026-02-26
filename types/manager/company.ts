export type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
  errors: any;
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
};

export type CreateCompanyDto = {
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
};

export type UpdateCompanyDto = Partial<CreateCompanyDto>;