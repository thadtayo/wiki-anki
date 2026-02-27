import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

function QuestionCard(props: {
  question: { question: string; answer: string };
  index: number;
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <View className="bg-muted flex flex-col rounded-lg p-4">
      <View className="flex flex-row items-start gap-3">
        <View className="bg-primary h-7 w-7 items-center justify-center rounded-full">
          <Text className="text-sm font-bold text-white">
            {props.index + 1}
          </Text>
        </View>
        <Text className="text-foreground flex-1 text-sm font-medium">
          {props.question.question}
        </Text>
      </View>
      {showAnswer ? (
        <View className="mt-3 ml-10">
          <Text className="text-muted-foreground text-sm">
            {props.question.answer}
          </Text>
          <Pressable className="mt-2" onPress={() => setShowAnswer(false)}>
            <Text className="text-primary text-xs font-semibold">
              Hide Answer
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-3 ml-10">
          <Pressable
            className="border-input rounded-md border px-3 py-1.5 self-start"
            onPress={() => setShowAnswer(true)}
          >
            <Text className="text-foreground text-xs">Show Answer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function GenerateScreen() {
  const [url, setUrl] = useState("");

  const { mutate, data, error, isPending } = useMutation(
    trpc.generate.fromWikipedia.mutationOptions({}),
  );

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Generate Flashcards" }} />
      <ScrollView className="h-full w-full p-4">
        <Text className="text-foreground pb-2 text-center text-3xl font-bold">
          Wiki <Text className="text-primary">Flashcards</Text>
        </Text>
        <Text className="text-muted-foreground pb-4 text-center text-sm">
          Paste a Wikipedia URL to generate trivia flashcards
        </Text>

        <View className="flex gap-2">
          <TextInput
            className="border-input bg-background text-foreground items-center rounded-md border px-3 text-lg leading-tight"
            value={url}
            onChangeText={setUrl}
            placeholder="https://en.wikipedia.org/wiki/..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Pressable
            className="bg-primary flex items-center rounded-sm p-2"
            disabled={isPending}
            onPress={() => mutate({ url })}
          >
            <Text className="text-foreground font-semibold">
              {isPending ? "Generating..." : "Generate Flashcards"}
            </Text>
          </Pressable>
          {error?.data?.code === "UNAUTHORIZED" && (
            <Text className="text-destructive mt-2">
              You need to be logged in to generate flashcards
            </Text>
          )}
          {error && error.data?.code !== "UNAUTHORIZED" && (
            <Text className="text-destructive mt-2">{error.message}</Text>
          )}
        </View>

        {isPending && (
          <View className="mt-8 items-center gap-2">
            <ActivityIndicator size="large" color="#c03484" />
            <Text className="text-muted-foreground text-sm">
              Generating flashcards... this may take 10-15 seconds
            </Text>
          </View>
        )}

        {data && (
          <View className="mt-6 flex gap-3 pb-8">
            <View className="flex flex-row items-baseline justify-between">
              <Text className="text-primary text-xl font-bold">
                {data.title}
              </Text>
              <Text className="text-muted-foreground text-sm">
                {data.questions.length} questions
              </Text>
            </View>
            {data.questions.map((q, i) => (
              <QuestionCard key={i} question={q} index={i} />
            ))}
          </View>
        )}

        {/* Bottom spacing for scroll */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
