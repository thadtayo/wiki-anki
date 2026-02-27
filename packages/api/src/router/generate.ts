import type { TRPCRouterRecord } from "@trpc/server";
import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { z } from "zod/v4";

import {
  generateQuestionsOutputSchema,
  wikipediaUrlSchema,
} from "@acme/validators";

import { protectedProcedure } from "../trpc";

const MAX_CHUNK_CHARS = 12_000;
const MIN_CHUNK_CHARS = 500;
const MAX_TOTAL_CHARS = 100_000;
const MAX_QUESTIONS = 50;

interface Chunk {
  title: string;
  content: string;
}

function splitIntoChunks(content: string): Chunk[] {
  // Split on Wikipedia section headers: == Title ==
  const sectionRegex = /^(={2,})\s*(.+?)\s*\1$/gm;
  const sections: Chunk[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      const last = sections.at(-1);
      if (last) {
        last.content += "\n\n" + textBefore;
      } else {
        sections.push({ title: "Introduction", content: textBefore });
      }
    }
    const sectionTitle = match[2] ?? "Untitled";
    sections.push({ title: sectionTitle.trim(), content: "" });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last header
  const remaining = content.slice(lastIndex).trim();
  if (remaining) {
    const last = sections.at(-1);
    if (last) {
      last.content += "\n\n" + remaining;
    } else {
      sections.push({ title: "Introduction", content: remaining });
    }
  }

  // Trim section content
  for (const section of sections) {
    section.content = section.content.trim();
  }

  // Remove empty sections
  const nonEmpty = sections.filter((s) => s.content.length > 0);
  if (nonEmpty.length === 0) return [];

  // Merge small sections with the next one
  const merged: Chunk[] = [];
  for (const section of nonEmpty) {
    const prev = merged.at(-1);
    if (prev && prev.content.length < MIN_CHUNK_CHARS) {
      prev.content += "\n\n" + section.content;
      prev.title += " / " + section.title;
    } else {
      merged.push({ ...section });
    }
  }

  // Split oversized sections at paragraph boundaries
  const chunks: Chunk[] = [];
  for (const section of merged) {
    if (section.content.length <= MAX_CHUNK_CHARS) {
      chunks.push(section);
      continue;
    }
    const paragraphs = section.content.split(/\n\n+/);
    let current = "";
    let partNum = 1;
    for (const para of paragraphs) {
      if (
        current.length + para.length + 2 > MAX_CHUNK_CHARS &&
        current.length > 0
      ) {
        chunks.push({
          title: `${section.title} (part ${partNum})`,
          content: current.trim(),
        });
        partNum++;
        current = para;
      } else {
        current += (current ? "\n\n" : "") + para;
      }
    }
    if (current.trim()) {
      chunks.push({
        title:
          partNum > 1 ? `${section.title} (part ${partNum})` : section.title,
        content: current.trim(),
      });
    }
  }

  return chunks;
}

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
      const apiUrl =
        `https://${url.hostname}/w/api.php?` +
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
          pages: Record<
            string,
            { pageid?: number; extract?: string; missing?: string }
          >;
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

      const chunks = splitIntoChunks(content.slice(0, MAX_TOTAL_CHARS));
      if (chunks.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not extract meaningful sections from the article",
        });
      }

      // Generate Q&A pairs for each chunk in parallel
      const results = await Promise.allSettled(
        chunks.map((chunk) =>
          generateObject({
            model: openai("gpt-4o-mini"),
            schema: generateQuestionsOutputSchema,
            prompt: `You are a trivia question generator. Based on the following section from the Wikipedia article "${title}", generate interesting trivia-style question and answer pairs. Generate as many questions as are appropriate for the content — more for rich, factual sections and fewer for shorter ones. Return an empty array if the section is not suitable for trivia (e.g., "See also", "References", lists of coordinates, or overly technical content). Keep answers concise (1-2 sentences).

Section: ${chunk.title}

${chunk.content}`,
          }),
        ),
      );

      const allQuestions = results.flatMap((r) =>
        r.status === "fulfilled" ? r.value.object.questions : [],
      );

      if (allQuestions.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate any questions from the article",
        });
      }

      return {
        title,
        questions: allQuestions.slice(0, MAX_QUESTIONS),
      };
    }),
} satisfies TRPCRouterRecord;
