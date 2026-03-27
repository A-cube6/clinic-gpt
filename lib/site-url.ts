export function getPublicSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "");

  return configured.replace(/\/$/, "");
}
