import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";

import { initAuth } from "@acme/auth";

import { env } from "~/env";

const PROD_URL = "https://wiki-anki.vercel.app";

const baseUrl =
  env.VERCEL_ENV === "production"
    ? PROD_URL
    : env.VERCEL_ENV === "preview"
      ? `https://${env.VERCEL_URL}`
      : "http://localhost:3000";

export const auth = initAuth({
  baseUrl,
  secret: env.AUTH_SECRET,
  extraPlugins: [nextCookies()],
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
