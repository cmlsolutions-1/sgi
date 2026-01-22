// lib/auth-mock.ts
export type Company = { id: string; name: string };
export type UserRole = "superadmin" | "asesor" | "empresa";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  password: string; // MVP: texto plano (en prod: hash)
  companies: Company[]; // empresas disponibles para ese correo
};

export const SGI_COMPANY: Company = { id: "sgi", name: "Sistema de Gestión Integral" };

export const USERS: AuthUser[] = [
  {
    id: "u1",
    email: "super@sgi.com",
    role: "superadmin",
    password: "123456",
    companies: [SGI_COMPANY],
  },
  {
    id: "u2",
    email: "asesor@sgi.com",
    role: "asesor",
    password: "123456",
    companies: [
      { id: "c1", name: "Empresa Alfa S.A.S" },
      { id: "c2", name: "Empresa Beta LTDA" },
    ],
  },
];

export function findUserByEmail(email: string) {
  return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
