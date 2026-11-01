// src\app\api\auth\[...nextauth]\route.ts
// جسر Auth.js مع Next: تسجيل الدخول والجلسات.
import { handlers } from "@/lib/auth/config";

export const { GET, POST } = handlers;
