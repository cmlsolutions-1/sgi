export type EmployeeImportRow = {
  row: number
  name: string
  lastName: string
  documentType: string
  documentNumber: string
  gender?: string
  phone: string
  email: string
  address: string
  birthDate: string
  workAreaId: string
  jobId: string
}
export type EmployeeImportIssue = { field: string; code: string; message: string }
export type EmployeeImportRowResult = { row: number | null; valid: boolean; created: boolean; employeeId: string | null; errors: EmployeeImportIssue[] }
export type EmployeeImportResult = { total: number; valid: number; invalid: number; created: number; rows: EmployeeImportRowResult[] }
export type EmployeeImportCatalogs = {
  areas: { id: string; name: string }[]
  jobs: { id: string; name: string; workAreaId: string }[]
}
