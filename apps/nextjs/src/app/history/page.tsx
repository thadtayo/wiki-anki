import { HydrateClient } from "~/trpc/server";
import { HistoryList } from "./_components/history-list";

export default function HistoryPage() {
  return (
    <HydrateClient>
      <main className="container h-screen py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="font-serif text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Your <span className="text-primary">History</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Previously sent Anki sets
          </p>
          <HistoryList />
        </div>
      </main>
    </HydrateClient>
  );
}
