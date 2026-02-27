import { authRouter } from "./router/auth";
import { generateRouter } from "./router/generate";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  generate: generateRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
