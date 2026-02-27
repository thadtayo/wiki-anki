import { ankiSetRouter } from "./router/anki-set";
import { authRouter } from "./router/auth";
import { generateRouter } from "./router/generate";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  generate: generateRouter,
  ankiSet: ankiSetRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
