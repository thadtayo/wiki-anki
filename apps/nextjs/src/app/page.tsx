import Link from "next/link";

import { HydrateClient } from "~/trpc/server";
import { AuthShowcase } from "./_components/auth-showcase";

export default function HomePage() {
  return (
    <HydrateClient>
      <main className="container h-screen py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="font-serif text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Wiki <span className="text-primary">Anki</span>
          </h1>
          <Link
            href="/generate"
            className="text-primary text-lg font-semibold underline underline-offset-4 hover:opacity-80"
          >
            Generate Flashcards from Wikipedia
          </Link>
          <AuthShowcase />
        </div>
      </main>
    </HydrateClient>
  );
}
