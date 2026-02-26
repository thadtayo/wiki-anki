import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.post.findMany({ orderBy: { id: "desc" }, take: 10 });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.post.findUnique({ where: { id: input.id } });
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().max(256), content: z.string().max(256) }))
    .mutation(({ ctx, input }) => {
      return ctx.db.post.create({ data: input });
    }),

  delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.post.delete({ where: { id: input } });
  }),
} satisfies TRPCRouterRecord;
