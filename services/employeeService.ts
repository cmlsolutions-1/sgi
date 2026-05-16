import { apiFetch } from "@/lib/apiClient"
import type {
  CreateEmployeeCertificationDto,
  CreateEmployeeContractDto,
  CreateEmployeeDto,
  CreateEmployeeEducationDto,
  CreateEmployeeEvaluationDto,
  CreateEmployeeMedicalEvaluationDto,
  Employee,
  EmployeeCatalogOption,
  EmployeeCatalogResponse,
  EmployeeCertification,
  EmployeeCertificationResponse,
  EmployeeCertificationsResponse,
  EmployeeContract,
  EmployeeContractResponse,
  EmployeeContractsResponse,
  EmployeeEducation,
  EmployeeEducationResponse,
  EmployeeEducationsResponse,
  EmployeeEvaluation,
  EmployeeEvaluationResponse,
  EmployeeEvaluationsResponse,
  EmployeeMedicalEvaluation,
  EmployeeMedicalEvaluationResponse,
  EmployeeMedicalEvaluationsResponse,
  EmployeeResponse,
  EmployeeSgiResponsible,
  EmployeeSgiResponsibleResponse,
  EmployeesResponse,
  UpdateEmployeeCertificationDto,
  UpdateEmployeeContractDto,
  UpdateEmployeeDto,
  UpdateEmployeeEducationDto,
  UpdateEmployeeEvaluationDto,
  UpdateEmployeeMedicalEvaluationDto,
  UpdateEmployeeSocialSecurityDto,
  UpsertEmployeeSgiResponsibleDto,
} from "@/types/manager/employee"

async function parseOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | EmployeeResponse
    | EmployeesResponse
    | EmployeeCatalogResponse
    | EmployeeCertificationResponse
    | EmployeeCertificationsResponse
    | EmployeeContractResponse
    | EmployeeContractsResponse
    | EmployeeEducationResponse
    | EmployeeEducationsResponse
    | EmployeeEvaluationResponse
    | EmployeeEvaluationsResponse
    | EmployeeMedicalEvaluationResponse
    | EmployeeMedicalEvaluationsResponse
    | EmployeeSgiResponsibleResponse
    | null

  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? fallbackMsg)
  }

  return json.data as T
}

export async function createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
  const res = await apiFetch("/api/employee", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Employee>(res, "No se pudo crear el funcionario")
}

export async function listEmployees(): Promise<Employee[]> {
  const res = await apiFetch("/api/employee", { method: "GET" })
  return parseOrThrow<Employee[]>(res, "No se pudo listar los funcionarios")
}

export async function getEmployeeById(id: string): Promise<Employee> {
  const res = await apiFetch(`/api/employee/${id}`, { method: "GET" })
  return parseOrThrow<Employee>(res, "No se pudo cargar el funcionario")
}

export async function updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
  const res = await apiFetch(`/api/employee/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Employee>(res, "No se pudo actualizar el funcionario")
}

export async function deleteEmployee(id: string): Promise<void> {
  const res = await apiFetch(`/api/employee/${id}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el funcionario")
}

export async function updateEmployeeSocialSecurity(
  id: string,
  dto: UpdateEmployeeSocialSecurityDto,
): Promise<Employee> {
  const res = await apiFetch(`/api/employee/${id}/social-security`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<Employee>(res, "No se pudo actualizar la seguridad social")
}

export async function activateEmployee(id: string): Promise<void> {
  const res = await apiFetch(`/api/employee/active/${id}`, { method: "PUT" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo activar el funcionario")
}

export async function listEpsCatalog(): Promise<EmployeeCatalogOption[]> {
  const res = await apiFetch("/api/employees/catalogs/eps", { method: "GET" })
  return parseOrThrow<EmployeeCatalogOption[]>(res, "No se pudo cargar el catalogo de EPS")
}

export async function listArlCatalog(): Promise<EmployeeCatalogOption[]> {
  const res = await apiFetch("/api/employees/catalogs/arl", { method: "GET" })
  return parseOrThrow<EmployeeCatalogOption[]>(res, "No se pudo cargar el catalogo de ARL")
}

export async function listPensionCatalog(): Promise<EmployeeCatalogOption[]> {
  const res = await apiFetch("/api/employees/catalogs/pensions", { method: "GET" })
  return parseOrThrow<EmployeeCatalogOption[]>(res, "No se pudo cargar el catalogo de pensiones")
}

export async function listCompensationCatalog(): Promise<EmployeeCatalogOption[]> {
  const res = await apiFetch("/api/employees/catalogs/compensations", { method: "GET" })
  return parseOrThrow<EmployeeCatalogOption[]>(res, "No se pudo cargar el catalogo de cajas de compensacion")
}

export async function createEmployeeEducation(
  employeeId: string,
  dto: CreateEmployeeEducationDto,
): Promise<EmployeeEducation> {
  const res = await apiFetch(`/api/employees/${employeeId}/education`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeEducation>(res, "No se pudo crear la educacion")
}

export async function listEmployeeEducation(employeeId: string): Promise<EmployeeEducation[]> {
  const res = await apiFetch(`/api/employees/${employeeId}/education`, { method: "GET" })
  return parseOrThrow<EmployeeEducation[]>(res, "No se pudo cargar la educacion")
}

export async function getEmployeeEducationById(employeeId: string, educationId: string): Promise<EmployeeEducation> {
  const res = await apiFetch(`/api/employees/${employeeId}/education/${educationId}`, { method: "GET" })
  return parseOrThrow<EmployeeEducation>(res, "No se pudo cargar la educacion")
}

export async function updateEmployeeEducation(
  employeeId: string,
  educationId: string,
  dto: UpdateEmployeeEducationDto,
): Promise<EmployeeEducation> {
  const res = await apiFetch(`/api/employees/${employeeId}/education/${educationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeEducation>(res, "No se pudo actualizar la educacion")
}

export async function deleteEmployeeEducation(employeeId: string, educationId: string): Promise<void> {
  const res = await apiFetch(`/api/employees/${employeeId}/education/${educationId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la educacion")
}

export async function createEmployeeCertification(
  employeeId: string,
  dto: CreateEmployeeCertificationDto,
): Promise<EmployeeCertification> {
  const res = await apiFetch(`/api/employees/${employeeId}/certifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeCertification>(res, "No se pudo crear la certificacion")
}

export async function listEmployeeCertifications(employeeId: string): Promise<EmployeeCertification[]> {
  const res = await apiFetch(`/api/employees/${employeeId}/certifications`, { method: "GET" })
  return parseOrThrow<EmployeeCertification[]>(res, "No se pudo cargar las certificaciones")
}

export async function getEmployeeCertificationById(
  employeeId: string,
  certificationId: string,
): Promise<EmployeeCertification> {
  const res = await apiFetch(`/api/employees/${employeeId}/certifications/${certificationId}`, { method: "GET" })
  return parseOrThrow<EmployeeCertification>(res, "No se pudo cargar la certificacion")
}

export async function updateEmployeeCertification(
  employeeId: string,
  certificationId: string,
  dto: UpdateEmployeeCertificationDto,
): Promise<EmployeeCertification> {
  const res = await apiFetch(`/api/employees/${employeeId}/certifications/${certificationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeCertification>(res, "No se pudo actualizar la certificacion")
}

export async function deleteEmployeeCertification(employeeId: string, certificationId: string): Promise<void> {
  const res = await apiFetch(`/api/employees/${employeeId}/certifications/${certificationId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la certificacion")
}

export async function createEmployeeContract(
  employeeId: string,
  dto: CreateEmployeeContractDto,
): Promise<EmployeeContract> {
  const res = await apiFetch(`/api/employees/${employeeId}/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeContract>(res, "No se pudo crear el contrato")
}

export async function listEmployeeContracts(employeeId: string): Promise<EmployeeContract[]> {
  const res = await apiFetch(`/api/employees/${employeeId}/contracts`, { method: "GET" })
  return parseOrThrow<EmployeeContract[]>(res, "No se pudo cargar los contratos")
}

export async function getEmployeeContractById(employeeId: string, contractId: string): Promise<EmployeeContract> {
  const res = await apiFetch(`/api/employees/${employeeId}/contracts/${contractId}`, { method: "GET" })
  return parseOrThrow<EmployeeContract>(res, "No se pudo cargar el contrato")
}

export async function updateEmployeeContract(
  employeeId: string,
  contractId: string,
  dto: UpdateEmployeeContractDto,
): Promise<EmployeeContract> {
  const res = await apiFetch(`/api/employees/${employeeId}/contracts/${contractId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeContract>(res, "No se pudo actualizar el contrato")
}

export async function deleteEmployeeContract(employeeId: string, contractId: string): Promise<void> {
  const res = await apiFetch(`/api/employees/${employeeId}/contracts/${contractId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar el contrato")
}

export async function createEmployeeEvaluation(
  employeeId: string,
  dto: CreateEmployeeEvaluationDto,
): Promise<EmployeeEvaluation> {
  const res = await apiFetch(`/api/employees/${employeeId}/evaluations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeEvaluation>(res, "No se pudo crear la evaluacion")
}

export async function listEmployeeEvaluations(employeeId: string): Promise<EmployeeEvaluation[]> {
  const res = await apiFetch(`/api/employees/${employeeId}/evaluations`, { method: "GET" })
  return parseOrThrow<EmployeeEvaluation[]>(res, "No se pudo cargar las evaluaciones")
}

export async function getEmployeeEvaluationById(employeeId: string, evaluationId: string): Promise<EmployeeEvaluation> {
  const res = await apiFetch(`/api/employees/${employeeId}/evaluations/${evaluationId}`, { method: "GET" })
  return parseOrThrow<EmployeeEvaluation>(res, "No se pudo cargar la evaluacion")
}

export async function updateEmployeeEvaluation(
  employeeId: string,
  evaluationId: string,
  dto: UpdateEmployeeEvaluationDto,
): Promise<EmployeeEvaluation> {
  const res = await apiFetch(`/api/employees/${employeeId}/evaluations/${evaluationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeEvaluation>(res, "No se pudo actualizar la evaluacion")
}

export async function deleteEmployeeEvaluation(employeeId: string, evaluationId: string): Promise<void> {
  const res = await apiFetch(`/api/employees/${employeeId}/evaluations/${evaluationId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la evaluacion")
}

export async function createEmployeeMedicalEvaluation(
  employeeId: string,
  dto: CreateEmployeeMedicalEvaluationDto,
): Promise<EmployeeMedicalEvaluation> {
  const res = await apiFetch(`/api/employees/${employeeId}/medical-evaluations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeMedicalEvaluation>(res, "No se pudo crear la evaluacion medica")
}

export async function listEmployeeMedicalEvaluations(employeeId: string): Promise<EmployeeMedicalEvaluation[]> {
  const res = await apiFetch(`/api/employees/${employeeId}/medical-evaluations`, { method: "GET" })
  return parseOrThrow<EmployeeMedicalEvaluation[]>(res, "No se pudo cargar las evaluaciones medicas")
}

export async function getEmployeeMedicalEvaluationById(
  employeeId: string,
  medicalEvaluationId: string,
): Promise<EmployeeMedicalEvaluation> {
  const res = await apiFetch(`/api/employees/${employeeId}/medical-evaluations/${medicalEvaluationId}`, { method: "GET" })
  return parseOrThrow<EmployeeMedicalEvaluation>(res, "No se pudo cargar la evaluacion medica")
}

export async function updateEmployeeMedicalEvaluation(
  employeeId: string,
  medicalEvaluationId: string,
  dto: UpdateEmployeeMedicalEvaluationDto,
): Promise<EmployeeMedicalEvaluation> {
  const res = await apiFetch(`/api/employees/${employeeId}/medical-evaluations/${medicalEvaluationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeMedicalEvaluation>(res, "No se pudo actualizar la evaluacion medica")
}

export async function deleteEmployeeMedicalEvaluation(employeeId: string, medicalEvaluationId: string): Promise<void> {
  const res = await apiFetch(`/api/employees/${employeeId}/medical-evaluations/${medicalEvaluationId}`, { method: "DELETE" })
  await parseOrThrow<Record<string, never>>(res, "No se pudo eliminar la evaluacion medica")
}

export async function createSgiResponsible(dto: UpsertEmployeeSgiResponsibleDto): Promise<EmployeeSgiResponsible> {
  const res = await apiFetch("/api/employee/sgi-responsible", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeSgiResponsible>(res, "No se pudo asignar el responsable del SGI")
}

export async function getSgiResponsible(): Promise<EmployeeSgiResponsible> {
  const res = await apiFetch("/api/employee/sgi-responsible", { method: "GET" })
  return parseOrThrow<EmployeeSgiResponsible>(res, "No se pudo cargar el responsable del SGI")
}

export async function updateSgiResponsible(dto: UpsertEmployeeSgiResponsibleDto): Promise<EmployeeSgiResponsible> {
  const res = await apiFetch("/api/employee/sgi-responsible", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
  return parseOrThrow<EmployeeSgiResponsible>(res, "No se pudo actualizar el responsable del SGI")
}
