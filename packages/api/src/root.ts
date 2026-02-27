import { authRouter } from "./router/auth";
import { generateRouter } from "./router/generate";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  generate: generateRouter,
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
