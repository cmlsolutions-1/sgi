// types/manager/super-admin.ts

export type CompanyStatus = "active" | "inactive"
export type UserStatus = "active" | "inactive"

export type Company = {
  id: string
  name: string
  nit: string
  address: string
  phone: string
  email: string
  registrationDate: string
  status: CompanyStatus
  activeModules: string[]
  totalUsers: number
}

export type User = {
  id: string
  companyId: string
  name: string
  email: string
  roleId: string
  status: UserStatus
  creationDate: string
}

export type NivelRiesgoItem = {
  "CLASE DE RIESGO": number
  "CÓDIGO CIIU": number
  "CODIGO ADICIONAL": number
  "DESCRIPCION DE ACTIVIDAD ECONÓMICA FINAL": string
}

