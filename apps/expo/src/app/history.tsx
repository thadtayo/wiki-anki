import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

function QuestionItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <View className="bg-muted flex flex-col rounded-lg p-4">
      <View className="flex flex-row items-start gap-3">
        <View className="bg-primary h-7 w-7 items-center justify-center rounded-full">
          <Text className="text-primary-foreground text-sm font-bold">
            {index + 1}
          </Text>
        </View>
        <Text className="text-foreground flex-1 text-sm font-medium">
          {question}
        </Text>
      </View>
      {showAnswer ? (
        <View className="mt-3 ml-10">
          <Text className="text-muted-foreground text-sm">{answer}</Text>
          <Pressable className="mt-2" onPress={() => setShowAnswer(false)}>
            <Text className="text-primary text-xs font-semibold">
              Hide Answer
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-3 ml-10">
          <Pressable
            className="border-input self-start rounded-md border px-3 py-1.5"
            onPress={() => setShowAnswer(true)}
          >
            <Text className="text-foreground text-xs">Show Answer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function SetCard({
  set,
}: {
  set: {
    id: string;
    title: string;
    wikipediaUrl: string;
    createdAt: Date;
    _count: { questions: number };
  };
}) {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery(
    trpc.ankiSet.byId.queryOptions({ id: set.id }, { enabled: expanded }),
  );

  return (
    <View className="bg-card border-border rounded-lg border p-4">
      <View className="flex flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-foreground text-lg font-semibold">
            {set.title}
          </Text>
          <Pressable onPress={() => Linking.openURL(set.wikipediaUrl)}>
            <Text className="text-primary text-sm underline">
              {set.wikipediaUrl}
            </Text>
          </Pressable>
          <View className="mt-1 flex flex-row gap-3">
            <Text className="text-muted-foreground text-sm">
              {set._count.questions} questions
            </Text>
            <Text className="text-muted-foreground text-sm">
              {set.createdAt.toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Pressable
          className="border-input rounded-md border px-3 py-1.5"
          onPress={() => setExpanded(!expanded)}
        >
          <Text className="text-foreground text-sm font-semibold">
            {expanded ? "Collapse" : "Expand"}
          </Text>
        </Pressable>
      </View>

      {expanded && (
        <View className="mt-4 flex gap-3">
          {isLoading && (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#1E293B" />
            </View>
          )}
          {data?.questions.map((q, i) => (
            <QuestionItem
              key={q.id}
              question={q.question}
              answer={q.answer}
              index={i}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const { data, isLoading, error } = useQuery(trpc.ankiSet.list.queryOptions());

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "History" }} />
      <ScrollView className="h-full w-full p-4">
        <Text className="text-foreground pb-2 text-center font-[Merriweather_700Bold] text-3xl font-bold">
          Your <Text className="text-primary">History</Text>
        </Text>
        <Text className="text-muted-foreground pb-4 text-center text-sm">
          Previously sent Anki sets
        </Text>

        {isLoading && (
          <View className="mt-8 items-center gap-2">
            <ActivityIndicator size="large" color="#1E293B" />
            <Text className="text-muted-foreground text-sm">
              Loading your history...
            </Text>
          </View>
        )}

        {error && (
          <Text className="text-destructive mt-4 text-center">
            {error.data?.code === "UNAUTHORIZED"
              ? "You must be logged in to view history"
              : error.message || "Failed to load history"}
          </Text>
        )}

        {!isLoading && !error && (!data || data.length === 0) && (
          <Text className="text-muted-foreground mt-8 text-center">
            No Anki sets yet. Generate some flashcards to get started!
          </Text>
        )}

        {data && data.length > 0 && (
          <View className="mt-4 flex gap-4 pb-8">
            {data.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
