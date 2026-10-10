import { clearSession } from "@/lib/server/session";
import { jsonSuccess } from "@/lib/server/http";

export async function POST() {
  await clearSession();
  return jsonSuccess(null, "Logged out successfully.");
}