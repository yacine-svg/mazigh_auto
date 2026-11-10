export const CAR_IMAGE_STORAGE_PUBLIC_URL =
  "https://xpwsruxfoihigufozpgn.supabase.co/storage/v1/object/public/car-images/";

export function isCarImageStorageUrl(url: string): boolean {
  return url.startsWith(CAR_IMAGE_STORAGE_PUBLIC_URL) || url.startsWith("https://images.unsplash.com/");
}
