import { z } from "zod/v4";

export const wikipediaUrlSchema = z
  .url()
  .regex(
    /^https?:\/\/[a-z]{2,}\.wikipedia\.org\/wiki\/.+/i,
    "Must be a valid Wikipedia article URL (e.g. https://en.wikipedia.org/wiki/Example)",
  );

export const generateQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
});

export type GenerateQuestionsOutput = z.infer<
  typeof generateQuestionsOutputSchema
>;
