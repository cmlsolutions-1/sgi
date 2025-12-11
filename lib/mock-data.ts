// Datos mock para el sistema de gestión de calidad

export type Role = "admin" | "auditor" | "supervisor" | "empleado";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Training extends BaseEntity {
  companyId: string;
  topicId: string;
  date: string; // ISO o string normal
  durationInHours: number;
}

export interface TopicTraining extends BaseEntity {
  companyId: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface EmployeeTraining extends BaseEntity {
  topicId: string;
  employeeId: string;
  isAttended: boolean;
  urlCertificate: string | null;
}

export interface Evaluation {
  id: string;
  period: string;
  score: number;
  evaluator: string;
  comments: string;
}

export interface Document {
  id: string;
  name: string;
  type: "procedure" | "manual" | "record" | "policy" | "instruction";
  version: string;
  status: "draft" | "review" | "approved" | "obsolete";
  createdAt: string;
  updatedAt: string;
  author: string;
  department: string;
  size: string;
}

export interface AuditFinding {
  id: string;
  type: "major" | "minor" | "observation" | "opportunity";
  description: string;
  area: string;
  status: "open" | "in-progress" | "closed";
  dueDate: string;
}

export interface QualityIndicator {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
  period: string;
}

export interface BaseEntity {
  id: string;
  status: boolean | "active" | "inactive";
}

export interface Company extends BaseEntity {
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  registrationDate: string; 
}

//aportes seguridad social
export interface SocialSecurity extends BaseEntity {
  employeeId: string;            
  epsId: string;
  arlId: string;
  pensionId: string;
  compensationBoxId: string;
  startDate: string;
  endDate?: string;              
}

//tipos de entidades seguridad social
export type SocialSecurityType =
  | "EPS"
  | "ARL"
  | "PENSION"
  | "CAJA_COMPENSACION";

export interface TypeSocialSecurity extends BaseEntity {
  name: string;
  type: SocialSecurityType;
}

// =====================================
// WorkArea
// =====================================
export interface WorkArea extends BaseEntity {
  companyId: string;
  name: string;
  description: string;
}

// =====================================
// Job
// =====================================
export interface Job extends BaseEntity {
  companyId: string;
  name: string;
  description: string;
  workAreId: string;
}

// =====================================
// Employee
// =====================================
export interface Employee extends BaseEntity {
  id: string; 
  name: string; 
  position?: string; 
  department?: string; 
  typeContract?: string; 
  phone?: string; 
  hireDate?: string;
  birthDate?: string; 
  address?: string; 
  education?: string; 
  certifications?: string[]; 
  trainings?: {
    id: string;
    name: string;
    date: string;
    duration: string;
    status: string;
  }[]; 
  evaluations?: Evaluation[]; 
  status: boolean | "active" | "inactive";
  companyId: string;
  userId: string;
  document: string;
  lastName: string;
  jobId: string;
  workAreId: string;
  entryDate: string; 
}

export const mockTopicTrainings: TopicTraining[] = [
  {
    id: "topic-001",
    companyId: "comp-001",
    name: "Seguridad Industrial",
    description: "Capacitación básica en seguridad laboral y riesgos",
    isActive: true,
    status: true,
  },
  {
    id: "topic-002",
    companyId: "comp-001",
    name: "Primeros Auxilios",
    description: "Curso introductorio de atención en emergencias",
    isActive: true,
    status: true,
  },
  {
    id: "topic-003",
    companyId: "comp-001",
    name: "Trabajo en Alturas",
    description:
      "Certificación obligatoria para trabajos superiores a 2 metros",
    isActive: true,
    status: true,
  },
];

export const mockTrainings: Training[] = [
  {
    id: "train-001",
    companyId: "comp-001",
    topicId: "topic-001",
    date: "2025-01-12",
    durationInHours: 4,
    status: true,
  },
  {
    id: "train-002",
    companyId: "comp-001",
    topicId: "topic-002",
    date: "2025-02-05",
    durationInHours: 3,
    status: true,
  },
  {
    id: "train-003",
    companyId: "comp-001",
    topicId: "topic-003",
    date: "2025-02-20",
    durationInHours: 8,
    status: true,
  },
];

export const mockEmployeeTrainings: EmployeeTraining[] = [
  {
    id: "empTrain-001",
    topicId: "topic-001",
    employeeId: "emp-001",
    isAttended: true,
    urlCertificate: "https://example.com/certificates/seguridad-emp001.pdf  ",
    status: true,
  },
  {
    id: "empTrain-002",
    topicId: "topic-002",
    employeeId: "emp-001",
    isAttended: false,
    urlCertificate: null,
    status: true,
  },
  {
    id: "empTrain-003",
    topicId: "topic-003",
    employeeId: "emp-002",
    isAttended: true,
    urlCertificate: "https://example.com/certificates/alturas-emp002.pdf  ",
    status: true,
  },
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Carlos Rodríguez",
    email: "carlos@sgc.com",
    role: "admin",
    password: "123456789",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "María García",
    email: "maria@sgc.com",
    role: "auditor",
    password: "123456789",
    status: "active",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "Juan Pérez",
    email: "juan@sgc.com",
    role: "supervisor",
    password: "123456789",
    status: "active",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana@sgc.com",
    role: "empleado",
    password: "123456789",
    status: "active",
    createdAt: "2024-04-05",
  },
  {
    id: "5",
    name: "Luis Hernández",
    email: "luis@sgc.com",
    role: "empleado",
    password: "123456789",
    status: "inactive",
    createdAt: "2024-05-12",
  },
  {
    id: "6",
    name: "Sofia López",
    email: "sofia@sgc.com",
    role: "auditor",
    password: "123456789",
    status: "active",
    createdAt: "2024-06-08",
  },
  {
    id: "7",
    name: "Diego Torres",
    email: "diego@sgc.com",
    role: "supervisor",
    password: "123456789",
    status: "active",
    createdAt: "2024-07-22",
  },
  {
    id: "8",
    name: "Laura Sánchez",
    email: "laura@sgc.com",
    role: "empleado",
    password: "123456789",
    status: "active",
    createdAt: "2024-08-15",
  },
];

// Mock Employees
export const mockEmployees: Employee[] = [
  {
    id: "emp-001",
    name: "Cristian Camilo",
    lastName: "Cortés Baquero",
    companyId: "comp-001",
    userId: "usr-123",
    document: "1025487965",
    jobId: "job-001",
    workAreId: "area-001",
    entryDate: "9 de septiembre del 2025",
    typeContract: "Término indefinido",
    status: true,
    position: "Desarrollador Full Stack",
    department: "Desarrollo de Software",
    phone: "+57 300 123 4567",
    hireDate: "2025-09-09",
    birthDate: "1990-01-01",
    address: "Calle 123 #45-67",
    education: "Ingeniería de Sistemas",
    certifications: ["Certificado React", "Certificado TypeScript"],
    trainings: [
      {
        id: "t1",
        name: "Seguridad Industrial",
        date: "2025-01-12",
        duration: "4 horas",
        status: "completed",
      },
      {
        id: "t2",
        name: "Primeros Auxilios",
        date: "2025-02-05",
        duration: "3 horas",
        status: "pending",
      },
    ],
    evaluations: [
      {
        id: "e1",
        period: "2025-S1",
        score: 95,
        evaluator: "Supervisor",
        comments: "Excelente desempeño",
      },
    ],
  },
  {
    id: "emp-002",
    name: "Jesus Camilo",
    lastName: "Berra Baque",
    companyId: "comp-001",
    userId: "usr-124",
    document: "1025487966",
    jobId: "job-001",
    workAreId: "area-001",
    entryDate: "9 de septiembre del 2025",
    typeContract: "Término indefinido",
    status: true,
    position: "Desarrollador Full Stack",
    department: "Desarrollo de Software",
    phone: "+57 300 123 4568",
    hireDate: "2025-09-09",
    birthDate: "1991-01-01",
    address: "Calle 124 #45-68",
    education: "Ingeniería de Sistemas",
    certifications: ["Certificado Angular", "Certificado Node.js"],
    trainings: [
      {
        id: "t1",
        name: "Seguridad Industrial",
        date: "2025-01-12",
        duration: "4 horas",
        status: "completed",
      },
    ],
    evaluations: [
      {
        id: "e1",
        period: "2025-S1",
        score: 90,
        evaluator: "Supervisor",
        comments: "Buen desempeño",
      },
    ],
  },
];

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
];

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
];

// Mock Quality Indicators
export const mockIndicators: QualityIndicator[] = [
  {
    id: "1",
    name: "Satisfacción del Cliente",
    value: 92,
    target: 90,
    unit: "%",
    trend: "up",
    period: "2024-Q4",
  },
  {
    id: "2",
    name: "Productos No Conformes",
    value: 1.2,
    target: 2,
    unit: "%",
    trend: "down",
    period: "2024-Q4",
  },
  {
    id: "3",
    name: "Eficiencia de Procesos",
    value: 87,
    target: 85,
    unit: "%",
    trend: "up",
    period: "2024-Q4",
  },
  {
    id: "4",
    name: "Cumplimiento de Entregas",
    value: 95,
    target: 98,
    unit: "%",
    trend: "stable",
    period: "2024-Q4",
  },
  {
    id: "5",
    name: "Auditorías Completadas",
    value: 12,
    target: 12,
    unit: "auditorías",
    trend: "stable",
    period: "2024",
  },
  {
    id: "6",
    name: "Hallazgos Cerrados",
    value: 85,
    target: 90,
    unit: "%",
    trend: "up",
    period: "2024-Q4",
  },
];

export const mockCompany = {
  id: "comp-001",
  name: "Tech Solutions S.A.S",
  nit: "900123456-7",
  address: "Cra 12 # 45-67, Bogotá",
  phone: "3205558899",
  email: "contacto@techsolutions.com",
  registrationDate: "2024-11-05",
  status: true,
};

export const mockWorkArea = {
  id: "area-001",
  companyId: "comp-001",
  name: "Desarrollo de Software",
  description:
    "Área encargada del análisis, diseño y desarrollo de soluciones tecnológicas",
  status: true,
};

export const mockJob = {
  id: "job-001",
  companyId: "comp-001",
  name: "Desarrollador Full Stack",
  description: "Encargado del desarrollo frontend y backend",
  workAreId: "area-001",
  status: true,
};

// Monthly data for charts
export const monthlyData = [
  {
    month: "Ene",
    noConformidades: 8,
    acciones: 12,
    auditorias: 2,
    satisfaccion: 88,
  },
  {
    month: "Feb",
    noConformidades: 6,
    acciones: 10,
    auditorias: 1,
    satisfaccion: 89,
  },
  {
    month: "Mar",
    noConformidades: 10,
    acciones: 15,
    auditorias: 2,
    satisfaccion: 87,
  },
  {
    month: "Abr",
    noConformidades: 5,
    acciones: 8,
    auditorias: 1,
    satisfaccion: 90,
  },
  {
    month: "May",
    noConformidades: 7,
    acciones: 11,
    auditorias: 2,
    satisfaccion: 91,
  },
  {
    month: "Jun",
    noConformidades: 4,
    acciones: 6,
    auditorias: 1,
    satisfaccion: 92,
  },
  {
    month: "Jul",
    noConformidades: 6,
    acciones: 9,
    auditorias: 2,
    satisfaccion: 90,
  },
  {
    month: "Ago",
    noConformidades: 3,
    acciones: 5,
    auditorias: 1,
    satisfaccion: 93,
  },
  {
    month: "Sep",
    noConformidades: 5,
    acciones: 7,
    auditorias: 2,
    satisfaccion: 91,
  },
  {
    month: "Oct",
    noConformidades: 4,
    acciones: 6,
    auditorias: 1,
    satisfaccion: 92,
  },
  {
    month: "Nov",
    noConformidades: 3,
    acciones: 5,
    auditorias: 2,
    satisfaccion: 94,
  },
  {
    month: "Dic",
    noConformidades: 2,
    acciones: 4,
    auditorias: 1,
    satisfaccion: 92,
  },
];

// Department distribution
export const departmentData = [
  { name: "Producción", empleados: 45, documentos: 28 },
  { name: "Calidad", empleados: 12, documentos: 45 },
  { name: "Logística", empleados: 20, documentos: 15 },
  { name: "RRHH", empleados: 8, documentos: 22 },
  { name: "Ventas", empleados: 15, documentos: 18 },
];

export const roles: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "auditor", label: "Auditor" },
  { value: "supervisor", label: "Supervisor" },
  { value: "empleado", label: "Empleado" },
];

export const departments = [
  "Dirección",
  "Calidad",
  "Producción",
  "Logística",
  "Recursos Humanos",
  "Ventas",
];

export const typeContract = [
  "Término Fijo",
  "Término Indefinido",
  "Obra o Labor",
  "Aprendizaje",
  "Ocasional",
];
