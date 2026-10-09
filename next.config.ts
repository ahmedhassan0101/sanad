import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // resend يعتمد على postal-mime (ESM فقط) ويفشل تضمينه في حزمة السيرفر،
  // فيُترك ليعمل وقت التشغيل من node_modules مباشرة.
  serverExternalPackages: ["resend", "postal-mime"],
};

export default nextConfig;
