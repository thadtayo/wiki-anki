import { HydrateClient } from "~/trpc/server";
import { GenerateForm } from "./_components/generate-form";

export default function GeneratePage() {
  return (
    <HydrateClient>
      <main className="container h-screen py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="font-serif text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Wiki <span className="text-primary">Flashcards</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Paste a Wikipedia URL to generate trivia flashcards
          </p>
          <GenerateForm />
        </div>
      </main>
    </HydrateClient>
  );
}
