import type { ChatSenderType, UserRole } from "@/types/database";

/** Тип строки в chat_messages для живого отправителя (не auto/ai). */
export function resolveHumanSenderType(role: UserRole): Extract<ChatSenderType, "client" | "operator" | "admin"> {
  if (role === "admin") return "admin";
  if (role === "operator") return "operator";
  return "client";
}
