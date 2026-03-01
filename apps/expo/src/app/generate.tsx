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

interface Question {
  question: string;
  answer: string;
}

function QuestionCard(props: {
  question: Question;
  index: number;
  onUpdate: (updated: Question) => void;
  onDelete: () => void;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <View className="bg-muted flex flex-col gap-3 rounded-lg p-4">
        <View className="flex flex-row items-start gap-3">
          <View className="bg-primary h-7 w-7 items-center justify-center rounded-full">
            <Text className="text-primary-foreground text-sm font-bold">
              {props.index + 1}
            </Text>
          </View>
          <View className="flex-1 gap-3">
            <View>
              <Text className="text-muted-foreground mb-1 text-xs font-medium">
                Question
              </Text>
              <TextInput
                className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
                value={props.question.question}
                onChangeText={(text) =>
                  props.onUpdate({ ...props.question, question: text })
                }
                multiline
              />
            </View>
            <View>
              <Text className="text-muted-foreground mb-1 text-xs font-medium">
                Answer
              </Text>
              <TextInput
                className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
                value={props.question.answer}
                onChangeText={(text) =>
                  props.onUpdate({ ...props.question, answer: text })
                }
                multiline
              />
            </View>
            <Pressable
              className="bg-primary self-start rounded-md px-3 py-1.5"
              onPress={() => setIsEditing(false)}
            >
              <Text className="text-primary-foreground text-sm font-semibold">Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-muted flex flex-col rounded-lg p-4">
      <View className="flex flex-row items-start gap-3">
        <View className="bg-primary h-7 w-7 items-center justify-center rounded-full">
          <Text className="text-primary-foreground text-sm font-bold">
            {props.index + 1}
          </Text>
        </View>
        <Text className="text-foreground flex-1 text-sm font-medium">
          {props.question.question}
        </Text>
        <View className="flex flex-row gap-1">
          <Pressable onPress={() => setIsEditing(true)}>
            <Text className="text-primary text-xs font-semibold">Edit</Text>
          </Pressable>
          <Pressable onPress={props.onDelete}>
            <Text className="text-destructive text-xs font-semibold">
              Delete
            </Text>
          </Pressable>
        </View>
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

export default function GenerateScreen() {
  const [url, setUrl] = useState("");
  const [editableQuestions, setEditableQuestions] = useState<Question[]>([]);
  const [editableTitle, setEditableTitle] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const { mutate, error, isPending } = useMutation(
    trpc.generate.fromWikipedia.mutationOptions({
      onSuccess: (data) => {
        setEditableQuestions(data.questions.map((q) => ({ ...q })));
        setEditableTitle(data.title);
        setHasGenerated(true);
      },
    }),
  );

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Generate Flashcards" }} />
      <ScrollView className="h-full w-full p-4">
        <Text className="text-foreground pb-2 text-center font-[Merriweather_700Bold] text-3xl font-bold">
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
            <ActivityIndicator size="large" color="#1E293B" />
            <Text className="text-muted-foreground text-sm">
              Generating flashcards... this may take 10-15 seconds
            </Text>
          </View>
        )}

        {hasGenerated && !isPending && (
          <View className="mt-6 flex gap-3 pb-8">
            <View className="flex flex-row items-baseline justify-between">
              <TextInput
                className="text-primary flex-1 text-xl font-bold"
                value={editableTitle}
                onChangeText={setEditableTitle}
              />
              <Text className="text-muted-foreground text-sm">
                {editableQuestions.length} questions
              </Text>
            </View>
            {editableQuestions.map((q, i) => (
              <QuestionCard
                key={i}
                question={q}
                index={i}
                onUpdate={(updated) =>
                  setEditableQuestions((prev) =>
                    prev.map((item, idx) => (idx === i ? updated : item)),
                  )
                }
                onDelete={() =>
                  setEditableQuestions((prev) =>
                    prev.filter((_, idx) => idx !== i),
                  )
                }
              />
            ))}
          </View>
        )}

        {/* Bottom spacing for scroll */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
