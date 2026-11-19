import { parseEmployeeImportWorkbook } from "./employee-import"
import type { EmployeeImportCatalogs } from "@/types/manager/employee-import"

self.onmessage = async (event: MessageEvent<{ buffer: ArrayBuffer; catalogs: EmployeeImportCatalogs }>) => {
  try { self.postMessage({ data: await parseEmployeeImportWorkbook(event.data.buffer, event.data.catalogs) }) }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : "No se pudo leer el archivo Excel" }) }
}
