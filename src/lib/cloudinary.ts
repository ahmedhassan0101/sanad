// تخزين صور الطلاب: رفع موقّع من السيرفر لمجلد المركز، وحذف عند الاستبدال.
import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryEnabled(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function client() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export function studentImageFolder(orgId: string): string {
  return `${orgId}/students`;
}

export async function uploadStudentImage(
  orgId: string,
  bytes: Buffer,
  filename: string,
): Promise<{ url: string; publicId: string }> {
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    client().uploader.upload_stream(
      { folder: studentImageFolder(orgId), resource_type: "image", filename_override: filename, use_filename: false, unique_filename: true },
      (error, result) => (error ? reject(error) : resolve(result as { secure_url: string; public_id: string })),
    ).end(bytes);
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteStudentImage(publicId: string): Promise<void> {
  try {
    await client().uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // أفضل جهد: لا نفشل الحفظ لو تعذر حذف الصورة.
  }
}
