import { getCurrentUser } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";
import { toPublicUser } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonSuccess({ user: null });
    }
    return jsonSuccess({ user: toPublicUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}