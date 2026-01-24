//data/manager/super-admin.seed.ts

import type { Company, User } from "@/types/manager/super-admin"

export const INITIAL_COMPANIES: Company[] = [
  {
    id: "1",
    name: "Tech Solutions S.A.",
    nit: "900123456",
    address: "Calle 10 # 20-30",
    phone: "3001234567",
    email: "contacto@techsolutions.com",
    registrationDate: "2024-01-15",
    status: "active",
    activeModules: ["usuarios", "empleados", "gestion-documental"],
    totalUsers: 1,
  },
  {
    id: "2",
    name: "Innovatech Group",
    nit: "900987654",
    address: "Carrera 50 # 10-20",
    phone: "3019876543",
    email: "admin@innovatech.com",
    registrationDate: "2024-02-20",
    status: "active",
    activeModules: ["usuarios", "planificacion", "riesgos"],
    totalUsers: 0,
  },
  {
    id: "3",
    name: "Global Services Corp",
    nit: "901555666",
    address: "Av 80 # 12-40",
    phone: "3025556667",
    email: "info@globalservices.com",
    registrationDate: "2024-03-10",
    status: "active",
    activeModules: ["usuarios", "empleados"],
    totalUsers: 0,
  },
  {
    id: "4",
    name: "Digital Partners",
    nit: "902333444",
    address: "Calle 100 # 15-20",
    phone: "3033334445",
    email: "hola@digitalpartners.com",
    registrationDate: "2024-04-05",
    status: "inactive",
    activeModules: ["usuarios", "gestion-documental", "planificacion", "riesgos"],
    totalUsers: 0,
  },
]

export const INITIAL_USERS: User[] = [
  {
    id: "u1",
    companyId: "1",
    name: "Admin Tech",
    email: "admin@techsolutions.com",
    roleId: "admin",
    status: "active",
    creationDate: "2024-01-15",
  },
]
