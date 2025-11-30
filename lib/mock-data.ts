// Datos mock para el sistema de gestión de calidad

export type Role = "admin" | "auditor" | "supervisor" | "empleado"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  department: string
  avatar?: string
  status: "active" | "inactive"
  createdAt: string
}

export interface Employee {
  id: string
  name: string
  email: string
  position: string
  department: string
  phone: string
  hireDate: string
  birthDate: string
  address: string
  education: string
  certifications: string[]
  trainings: Training[]
  evaluations: Evaluation[]
  avatar?: string
  status: "active" | "inactive"
}

export interface Training {
  id: string
  name: string
  date: string
  duration: string
  status: "completed" | "in-progress" | "pending"
}

export interface Evaluation {
  id: string
  period: string
  score: number
  evaluator: string
  comments: string
}

export interface Document {
  id: string
  name: string
  type: "procedure" | "manual" | "record" | "policy" | "instruction"
  version: string
  status: "draft" | "review" | "approved" | "obsolete"
  createdAt: string
  updatedAt: string
  author: string
  department: string
  size: string
}

export interface AuditFinding {
  id: string
  type: "major" | "minor" | "observation" | "opportunity"
  description: string
  area: string
  status: "open" | "in-progress" | "closed"
  dueDate: string
}

export interface QualityIndicator {
  id: string
  name: string
  value: number
  target: number
  unit: string
  trend: "up" | "down" | "stable"
  period: string
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Carlos Rodríguez",
    email: "carlos@sgc.com",
    role: "admin",
    department: "Dirección",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "María García",
    email: "maria@sgc.com",
    role: "auditor",
    department: "Calidad",
    status: "active",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "Juan Pérez",
    email: "juan@sgc.com",
    role: "supervisor",
    department: "Producción",
    status: "active",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana@sgc.com",
    role: "empleado",
    department: "Recursos Humanos",
    status: "active",
    createdAt: "2024-04-05",
  },
  {
    id: "5",
    name: "Luis Hernández",
    email: "luis@sgc.com",
    role: "empleado",
    department: "Producción",
    status: "inactive",
    createdAt: "2024-05-12",
  },
  {
    id: "6",
    name: "Sofia López",
    email: "sofia@sgc.com",
    role: "auditor",
    department: "Calidad",
    status: "active",
    createdAt: "2024-06-08",
  },
  {
    id: "7",
    name: "Diego Torres",
    email: "diego@sgc.com",
    role: "supervisor",
    department: "Logística",
    status: "active",
    createdAt: "2024-07-22",
  },
  {
    id: "8",
    name: "Laura Sánchez",
    email: "laura@sgc.com",
    role: "empleado",
    department: "Ventas",
    status: "active",
    createdAt: "2024-08-15",
  },
]

// Mock Employees
export const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "Carlos Rodríguez",
    email: "carlos@sgc.com",
    position: "Director de Calidad",
    department: "Dirección",
    phone: "+57 300 123 4567",
    hireDate: "2020-03-15",
    birthDate: "1985-06-20",
    address: "Calle 45 #12-30, Bogotá",
    education: "Ingeniería Industrial - Universidad Nacional",
    certifications: ["ISO 9001 Lead Auditor", "Six Sigma Black Belt", "PMP"],
    trainings: [
      {
        id: "t1",
        name: "Auditoría Interna ISO 9001:2015",
        date: "2024-03-15",
        duration: "40 horas",
        status: "completed",
      },
      { id: "t2", name: "Gestión de Riesgos", date: "2024-06-20", duration: "24 horas", status: "completed" },
      {
        id: "t3",
        name: "Liderazgo y Gestión de Equipos",
        date: "2024-11-10",
        duration: "16 horas",
        status: "in-progress",
      },
    ],
    evaluations: [
      {
        id: "e1",
        period: "2024-S1",
        score: 95,
        evaluator: "Gerente General",
        comments: "Excelente desempeño en implementación del SGC",
      },
      {
        id: "e2",
        period: "2023-S2",
        score: 92,
        evaluator: "Gerente General",
        comments: "Muy buen trabajo en auditorías internas",
      },
    ],
    status: "active",
  },
  {
    id: "2",
    name: "María García",
    email: "maria@sgc.com",
    position: "Auditora de Calidad",
    department: "Calidad",
    phone: "+57 301 234 5678",
    hireDate: "2021-07-01",
    birthDate: "1990-02-14",
    address: "Carrera 30 #45-12, Bogotá",
    education: "Ingeniería Química - Universidad de los Andes",
    certifications: ["ISO 9001 Internal Auditor", "ISO 14001 Awareness"],
    trainings: [
      { id: "t1", name: "Técnicas de Auditoría", date: "2024-02-10", duration: "32 horas", status: "completed" },
      { id: "t2", name: "ISO 45001", date: "2024-12-05", duration: "24 horas", status: "pending" },
    ],
    evaluations: [
      {
        id: "e1",
        period: "2024-S1",
        score: 88,
        evaluator: "Carlos Rodríguez",
        comments: "Buen desempeño, mejorar documentación",
      },
    ],
    status: "active",
  },
  {
    id: "3",
    name: "Juan Pérez",
    email: "juan@sgc.com",
    position: "Supervisor de Producción",
    department: "Producción",
    phone: "+57 302 345 6789",
    hireDate: "2019-11-20",
    birthDate: "1988-09-05",
    address: "Avenida 68 #23-45, Bogotá",
    education: "Tecnología en Producción Industrial - SENA",
    certifications: ["Lean Manufacturing", "Control de Calidad"],
    trainings: [
      {
        id: "t1",
        name: "Control Estadístico de Procesos",
        date: "2024-04-15",
        duration: "20 horas",
        status: "completed",
      },
    ],
    evaluations: [
      {
        id: "e1",
        period: "2024-S1",
        score: 85,
        evaluator: "Director de Operaciones",
        comments: "Cumple con objetivos de producción",
      },
    ],
    status: "active",
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana@sgc.com",
    position: "Analista de RRHH",
    department: "Recursos Humanos",
    phone: "+57 303 456 7890",
    hireDate: "2022-01-10",
    birthDate: "1992-12-01",
    address: "Calle 100 #15-20, Bogotá",
    education: "Psicología Organizacional - Universidad Javeriana",
    certifications: ["Gestión del Talento Humano"],
    trainings: [{ id: "t1", name: "Bienestar Laboral", date: "2024-05-20", duration: "16 horas", status: "completed" }],
    evaluations: [
      {
        id: "e1",
        period: "2024-S1",
        score: 90,
        evaluator: "Directora de RRHH",
        comments: "Excelente gestión de procesos de selección",
      },
    ],
    status: "active",
  },
  {
    id: "5",
    name: "Luis Hernández",
    email: "luis@sgc.com",
    position: "Operario de Producción",
    department: "Producción",
    phone: "+57 304 567 8901",
    hireDate: "2023-03-05",
    birthDate: "1995-07-18",
    address: "Carrera 50 #30-15, Bogotá",
    education: "Bachiller Técnico Industrial",
    certifications: ["Operación de Maquinaria"],
    trainings: [
      { id: "t1", name: "Seguridad Industrial", date: "2024-01-10", duration: "8 horas", status: "completed" },
    ],
    evaluations: [
      { id: "e1", period: "2024-S1", score: 78, evaluator: "Juan Pérez", comments: "Necesita mejorar puntualidad" },
    ],
    status: "inactive",
  },
]

// Mock Documents
export const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Manual de Calidad",
    type: "manual",
    version: "3.0",
    status: "approved",
    createdAt: "2024-01-10",
    updatedAt: "2024-06-15",
    author: "Carlos Rodríguez",
    department: "Calidad",
    size: "2.5 MB",
  },
  {
    id: "2",
    name: "Procedimiento de Auditorías Internas",
    type: "procedure",
    version: "2.1",
    status: "approved",
    createdAt: "2024-02-20",
    updatedAt: "2024-08-10",
    author: "María García",
    department: "Calidad",
    size: "1.2 MB",
  },
  {
    id: "3",
    name: "Política de Calidad",
    type: "policy",
    version: "1.5",
    status: "approved",
    createdAt: "2023-06-01",
    updatedAt: "2024-01-15",
    author: "Carlos Rodríguez",
    department: "Dirección",
    size: "500 KB",
  },
  {
    id: "4",
    name: "Instrucción de Control de Documentos",
    type: "instruction",
    version: "2.0",
    status: "review",
    createdAt: "2024-09-01",
    updatedAt: "2024-11-20",
    author: "María García",
    department: "Calidad",
    size: "800 KB",
  },
  {
    id: "5",
    name: "Registro de No Conformidades",
    type: "record",
    version: "1.0",
    status: "approved",
    createdAt: "2024-03-15",
    updatedAt: "2024-10-30",
    author: "Sofia López",
    department: "Calidad",
    size: "350 KB",
  },
  {
    id: "6",
    name: "Procedimiento de Acciones Correctivas",
    type: "procedure",
    version: "1.8",
    status: "draft",
    createdAt: "2024-10-01",
    updatedAt: "2024-11-25",
    author: "María García",
    department: "Calidad",
    size: "1.5 MB",
  },
  {
    id: "7",
    name: "Manual de Operaciones",
    type: "manual",
    version: "4.2",
    status: "approved",
    createdAt: "2023-01-20",
    updatedAt: "2024-07-10",
    author: "Juan Pérez",
    department: "Producción",
    size: "5.2 MB",
  },
  {
    id: "8",
    name: "Política de Seguridad y Salud",
    type: "policy",
    version: "2.0",
    status: "obsolete",
    createdAt: "2022-05-10",
    updatedAt: "2024-01-01",
    author: "Ana Martínez",
    department: "Recursos Humanos",
    size: "750 KB",
  },
]

// Mock Audit Findings
export const mockFindings: AuditFinding[] = [
  {
    id: "1",
    type: "major",
    description: "Falta de calibración en equipos de medición",
    area: "Producción",
    status: "in-progress",
    dueDate: "2024-12-15",
  },
  {
    id: "2",
    type: "minor",
    description: "Documentos desactualizados en área de trabajo",
    area: "Logística",
    status: "open",
    dueDate: "2024-12-30",
  },
  {
    id: "3",
    type: "observation",
    description: "Oportunidad de mejora en señalización",
    area: "Planta",
    status: "closed",
    dueDate: "2024-11-01",
  },
  {
    id: "4",
    type: "opportunity",
    description: "Implementar sistema de gestión digital",
    area: "Calidad",
    status: "open",
    dueDate: "2025-01-15",
  },
  {
    id: "5",
    type: "minor",
    description: "Registros de capacitación incompletos",
    area: "RRHH",
    status: "in-progress",
    dueDate: "2024-12-10",
  },
]

// Mock Quality Indicators
export const mockIndicators: QualityIndicator[] = [
  { id: "1", name: "Satisfacción del Cliente", value: 92, target: 90, unit: "%", trend: "up", period: "2024-Q4" },
  { id: "2", name: "Productos No Conformes", value: 1.2, target: 2, unit: "%", trend: "down", period: "2024-Q4" },
  { id: "3", name: "Eficiencia de Procesos", value: 87, target: 85, unit: "%", trend: "up", period: "2024-Q4" },
  { id: "4", name: "Cumplimiento de Entregas", value: 95, target: 98, unit: "%", trend: "stable", period: "2024-Q4" },
  {
    id: "5",
    name: "Auditorías Completadas",
    value: 12,
    target: 12,
    unit: "auditorías",
    trend: "stable",
    period: "2024",
  },
  { id: "6", name: "Hallazgos Cerrados", value: 85, target: 90, unit: "%", trend: "up", period: "2024-Q4" },
]

// Monthly data for charts
export const monthlyData = [
  { month: "Ene", noConformidades: 8, acciones: 12, auditorias: 2, satisfaccion: 88 },
  { month: "Feb", noConformidades: 6, acciones: 10, auditorias: 1, satisfaccion: 89 },
  { month: "Mar", noConformidades: 10, acciones: 15, auditorias: 2, satisfaccion: 87 },
  { month: "Abr", noConformidades: 5, acciones: 8, auditorias: 1, satisfaccion: 90 },
  { month: "May", noConformidades: 7, acciones: 11, auditorias: 2, satisfaccion: 91 },
  { month: "Jun", noConformidades: 4, acciones: 6, auditorias: 1, satisfaccion: 92 },
  { month: "Jul", noConformidades: 6, acciones: 9, auditorias: 2, satisfaccion: 90 },
  { month: "Ago", noConformidades: 3, acciones: 5, auditorias: 1, satisfaccion: 93 },
  { month: "Sep", noConformidades: 5, acciones: 7, auditorias: 2, satisfaccion: 91 },
  { month: "Oct", noConformidades: 4, acciones: 6, auditorias: 1, satisfaccion: 92 },
  { month: "Nov", noConformidades: 3, acciones: 5, auditorias: 2, satisfaccion: 94 },
  { month: "Dic", noConformidades: 2, acciones: 4, auditorias: 1, satisfaccion: 92 },
]

// Department distribution
export const departmentData = [
  { name: "Producción", empleados: 45, documentos: 28 },
  { name: "Calidad", empleados: 12, documentos: 45 },
  { name: "Logística", empleados: 20, documentos: 15 },
  { name: "RRHH", empleados: 8, documentos: 22 },
  { name: "Ventas", empleados: 15, documentos: 18 },
]

export const roles: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "auditor", label: "Auditor" },
  { value: "supervisor", label: "Supervisor" },
  { value: "empleado", label: "Empleado" },
]

export const departments = ["Dirección", "Calidad", "Producción", "Logística", "Recursos Humanos", "Ventas"]
