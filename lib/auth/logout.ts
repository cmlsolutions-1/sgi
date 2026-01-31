import { logoutRequest } from "@/services/authService";

export async function doLogout() {
  await logoutRequest();
}

