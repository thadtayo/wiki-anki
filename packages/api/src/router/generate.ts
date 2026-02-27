import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod/v4";

import {
  generateQuestionsOutputSchema,
  wikipediaUrlSchema,
} from "@acme/validators";

import { protectedProcedure } from "../trpc";

export const generateRouter = {
  fromWikipedia: protectedProcedure
    .input(z.object({ url: wikipediaUrlSchema }))
    .mutation(async ({ input }) => {
      // Parse article title from URL
      const url = new URL(input.url);
      const pathSegments = url.pathname.split("/wiki/");
      const rawTitle = pathSegments[1];
      if (!rawTitle) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not parse article title from URL",
        });
      }
      const title = decodeURIComponent(rawTitle.replace(/_/g, " "));

      // Fetch plaintext via MediaWiki API
      const apiUrl = `https://${url.hostname}/w/api.php?` +
        new URLSearchParams({
          action: "query",
          titles: rawTitle,
          prop: "extracts",
          explaintext: "true",
          format: "json",
        }).toString();

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to fetch Wikipedia article",
        });
      }

      const data = (await response.json()) as {
        query: {
          pages: Record<string, { pageid?: number; extract?: string; missing?: string }>;
        };
      };

      const pages = data.query.pages;
      const page = Object.values(pages)[0];

      if (!page || page.missing !== undefined || !page.extract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wikipedia article not found",
        });
      }

      const content = page.extract;
      if (content.length < 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Article content is too short to generate questions",
        });
      }

      // Truncate to ~24,000 chars to fit AI context windows
      const truncatedContent = content.slice(0, 24_000);

      // Generate Q&A pairs using AI
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: generateQuestionsOutputSchema,
        prompt: `You are a trivia question generator. Based on the following Wikipedia article about "${title}", generate exactly 10 interesting trivia-style question and answer pairs. Each question should test knowledge about key facts from the article. Keep answers concise (1-2 sentences).

Article content:
${truncatedContent}`,
      });

      return {
        title,
        questions: result.object.questions,
      };
    }),
} satisfies TRPCRouterRecord;
