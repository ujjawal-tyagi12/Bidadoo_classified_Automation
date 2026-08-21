import dotenv from "dotenv";

dotenv.config();

function optionalUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export const ENV = {
  BASE_URL: process.env.BASE_URL ?? "http://localhost:3000",

  MSITE_BASE_URL: optionalUrl(process.env.MSITE_BASE_URL),

  API_URL: process.env.API_URL ?? "http://localhost:3000/api",

  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "",

  ADMIN_EMAIL_P2: process.env.ADMIN_EMAIL_P2 ?? "",
  ADMIN_PASSWORD_P2: process.env.ADMIN_PASSWORD_P2 ?? "",
};
