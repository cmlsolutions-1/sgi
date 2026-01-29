// src/lib/permissions.ts
export type ModuleNode = {
  id: string;
  code: string;
  name: string;
  route: string;
  index: number;
  parentId: string | null;
  children?: ModuleNode[];
};

export function hasAnyCode(mods: ModuleNode[], codes: string[]): boolean {
  for (const m of mods) {
    if (codes.includes(m.code)) return true;
    if (m.children?.length && hasAnyCode(m.children, codes)) return true;
  }
  return false;
}

// Regla: ajusta los códigos que definan "manager"
export function isManagerUser(mods: ModuleNode[]): boolean {
  return hasAnyCode(mods, ["COMPANY", "COMPANIES", "ROLES", "USERS"]);
}
