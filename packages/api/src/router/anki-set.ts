import type { TRPCRouterRecord } from "@trpc/server";
import { Resend } from "resend";
import { z } from "zod/v4";

import { generateAnkiSet } from "../lib/generate-anki-set";
import { protectedProcedure } from "../trpc";

const resend = new Resend(process.env.RESEND_API_KEY);

export const ankiSetRouter = {
  sendToEmail: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        wikipediaUrl: z.url(),
        questions: z
          .array(z.object({ question: z.string(), answer: z.string() }))
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Save to DB
      console.log("[sendToEmail] Saving anki set to DB...");
      const ankiSet = await ctx.db.ankiSet.create({
        data: {
          title: input.title,
          wikipediaUrl: input.wikipediaUrl,
          userId: ctx.session.user.id,
          questions: {
            create: input.questions,
          },
        },
      });
      console.log("[sendToEmail] Saved anki set:", ankiSet.id);

      // 2. Generate .apkg
      console.log("[sendToEmail] Generating .apkg...");
      const apkgBuffer = await generateAnkiSet(ankiSet.id);
      console.log("[sendToEmail] Generated .apkg, size:", apkgBuffer.length, "bytes");

      // 3. Email via Resend
      const to = ctx.session.user.email;
      console.log("[sendToEmail] Sending email to:", to);
      console.log("[sendToEmail] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: "Wiki Anki <notifications@mailer.bloomtechnologies.co>",
        to,
        subject: `Your Anki deck: ${input.title}`,
        html: `<p>Your Anki deck "<strong>${input.title}</strong>" with ${input.questions.length} cards is attached.</p><p>Import the .apkg file into Anki to start studying!</p>`,
        attachments: [
          {
            filename: `${input.title}.apkg`,
            content: apkgBuffer.toString("base64"),
          },
        ],
      });

      if (error) {
        console.error("[sendToEmail] Resend error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log("[sendToEmail] Email sent successfully, id:", data?.id);
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
