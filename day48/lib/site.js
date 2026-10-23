// SITE_URL wins if set. On Vercel, fall back to the deployment's own URL so previews
// point at themselves and production points at the production domain (never localhost).
const vercelHost =
  process.env.VERCEL_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL;

export const SITE_URL = (
  process.env.SITE_URL || (vercelHost ? `https://${vercelHost}` : "https://addiseats.et")
).replace(/\/$/, "");
export const SITE_NAME = "Addis Eats";
