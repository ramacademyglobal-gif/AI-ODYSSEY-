import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

export type AuditActor = {
  email: string;
  username: string;
};

export async function writeAdminAuditLog(input: {
  admin: AuditActor;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("admin_audit_logs").insert({
    admin_id: null,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    metadata: {
      admin_email: input.admin.email,
      admin_username: input.admin.username,
      ...(input.metadata ?? {}),
    },
  });

  if (error) {
    throw new AppError(500, "Failed to write audit log", "AUDIT_LOG_FAILED");
  }
}
