// services/companyService.ts
import { apiFetch } from "@/lib/apiClient";
import type {
  ApiResponse,
  ChangeCompanyStatusDto,
  CompanyLite,
  CreateCompanyDto,
  UpdateCompanyDto,
} from "@/types/manager/company";



async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !json?.ok) {
    const msg = json?.errors?.find((error) => error.message)?.message ?? json?.message ?? fallbackMsg;
    throw new Error(msg);
  }

  return json.data;
}

export async function listCompanies(): Promise<CompanyLite[]> {
  const res = await apiFetch("/api/company", { method: "GET" });
  return parseOrThrow<CompanyLite[]>(res, "No se pudo listar compañías");
}

export async function getCompanyById(id: string): Promise<CompanyLite> {
  const res = await apiFetch(`/api/company/${id}`, { method: "GET" });
  return parseOrThrow<CompanyLite>(res, "No se pudo cargar la compañía");
}

export async function createCompany(dto: CreateCompanyDto): Promise<CompanyLite> {
  const res = await apiFetch("/api/company", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseOrThrow<CompanyLite>(res, "No se pudo crear la compañía");
}

export async function updateCompany(id: string, dto: UpdateCompanyDto): Promise<CompanyLite> {
  const res = await apiFetch(`/api/company/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseOrThrow<CompanyLite>(res, "No se pudo actualizar la compañía");
}

export async function deleteCompany(id: string): Promise<void> {
  const res = await apiFetch(`/api/company/${id}`, { method: "DELETE" });
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la compañía");
}

export async function changeCompanyStatus(id: string, dto: ChangeCompanyStatusDto): Promise<CompanyLite> {
  const res = await apiFetch(`/api/company/change-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseOrThrow<CompanyLite>(res, "No se pudo actualizar el estado de la compañía");
}
