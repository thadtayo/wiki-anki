"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";

import { z } from "zod/v4";
import { Button } from "@acme/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@acme/ui/field";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface Question {
  question: string;
  answer: string;
}

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-muted flex flex-col rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="bg-primary text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {index + 1}
        </span>
        <p className="text-sm font-medium">{question.question}</p>
      </div>
      {showAnswer ? (
        <div className="mt-3 ml-10">
          <p className="text-muted-foreground text-sm">{question.answer}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 cursor-pointer text-xs"
            onClick={() => setShowAnswer(false)}
          >
            Hide Answer
          </Button>
        </div>
      ) : (
        <div className="mt-3 ml-10">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer text-xs"
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
          </Button>
        </div>
      )}
    </div>
  );
}

function QuestionList({
  title,
  questions,
}: {
  title: string;
  questions: Question[];
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-primary text-2xl font-bold">{title}</h2>
        <span className="text-muted-foreground text-sm">
          {questions.length} questions
        </span>
      </div>
      {questions.map((q, i) => (
        <QuestionCard key={i} question={q} index={i} />
      ))}
    </div>
  );
}

export function GenerateForm() {
  const trpc = useTRPC();

  const generate = useMutation(
    trpc.generate.fromWikipedia.mutationOptions({
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to generate flashcards"
            : err.message || "Failed to generate flashcards",
        );
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      url: "",
    },
    validators: {
      onSubmit: z.object({
        url: z
          .url()
          .regex(
            /^https?:\/\/[a-z]{2,}\.wikipedia\.org\/wiki\/.+/i,
            "Must be a valid Wikipedia article URL (e.g. https://en.wikipedia.org/wiki/Example)",
          ),
      }),
    },
    onSubmit: (data) => generate.mutate({ url: data.value.url }),
  });

  return (
    <div className="w-full max-w-2xl">
      <form
        className="w-full"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field
            name="url"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>
                      Wikipedia URL
                    </FieldLabel>
                  </FieldContent>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="https://en.wikipedia.org/wiki/Albert_Einstein"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </FieldGroup>
        <Button
          type="submit"
          className="mt-4"
          disabled={generate.isPending}
        >
          {generate.isPending ? "Generating..." : "Generate Flashcards"}
        </Button>
      </form>

      {generate.isPending && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground text-sm">
            Generating flashcards... this may take 10-15 seconds
          </p>
        </div>
      )}

      {generate.data && (
        <div className="mt-8">
          <QuestionList
            title={generate.data.title}
            questions={generate.data.questions}
          />
        </div>
      )}
    </div>
  );
}
