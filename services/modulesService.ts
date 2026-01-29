// src/services/modulesService.ts
import { apiFetch } from "@/lib/apiClient";

export type ModuleNode = {
  id: string;
  code: string;
  name: string;
  route: string;
  index: number;
  parentId: string | null;
  children?: ModuleNode[];
};

export async function getMyModules(): Promise<ModuleNode[]> {
  const res = await apiFetch("/api/modules/me", { method: "GET" });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message ?? "No se pudo cargar módulos");
  }

  return (json?.data ?? []) as ModuleNode[];
}
