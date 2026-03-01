"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";

import { useTRPC } from "~/trpc/react";

function QuestionItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-muted flex flex-col rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="bg-primary text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium">{question}</p>
      </div>
      {showAnswer ? (
        <div className="mt-3 ml-10">
          <p className="text-muted-foreground text-sm">{answer}</p>
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

function SetCard({ set }: { set: { id: string; title: string; wikipediaUrl: string; createdAt: Date; _count: { questions: number } } }) {
  const trpc = useTRPC();
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery(
    trpc.ankiSet.byId.queryOptions({ id: set.id }, { enabled: expanded }),
  );

  return (
    <div className="bg-card border-border w-full rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-foreground text-lg font-semibold">{set.title}</h3>
          <a
            href={set.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm underline underline-offset-2 hover:opacity-80"
          >
            {set.wikipediaUrl}
          </a>
          <div className="text-muted-foreground mt-1 flex gap-3 text-sm">
            <span>{set._count.questions} questions</span>
            <span>{set.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Collapse" : "Expand"}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col gap-3">
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
          )}
          {data?.questions.map((q, i) => (
            <QuestionItem key={q.id} question={q.question} answer={q.answer} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export function HistoryList() {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(trpc.ankiSet.list.queryOptions());

  if (isLoading) {
    return (
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground text-sm">Loading your history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-destructive mt-4">
        {error.data?.code === "UNAUTHORIZED"
          ? "You must be logged in to view history"
          : error.message || "Failed to load history"}
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-muted-foreground mt-8">
        No Anki sets yet. Generate some flashcards to get started!
      </p>
    );
  }

  return (
    <div className="mt-4 flex w-full max-w-2xl flex-col gap-4">
      {data.map((set) => (
        <SetCard key={set.id} set={set} />
      ))}
    </div>
  );
}
