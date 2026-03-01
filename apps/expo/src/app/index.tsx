import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Stack } from "expo-router";

import { authClient } from "~/utils/auth";

function MobileAuth() {
  const { data: session } = authClient.useSession();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) {
    return (
      <>
        <Text className="text-foreground pb-2 text-center text-xl font-semibold">
          Hello, {session.user.name}
        </Text>
        <Pressable
          onPress={() => authClient.signOut()}
          className="bg-primary flex items-center rounded-sm p-2"
        >
          <Text>Sign Out</Text>
        </Pressable>
      </>
    );
  }

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (res.error) {
          setError(res.error.message ?? "Sign up failed");
          return;
        }
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
        });
        if (res.error) {
          setError(res.error.message ?? "Sign in failed");
          return;
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex gap-2">
      <Text className="text-foreground pb-2 text-center text-xl font-semibold">
        {isSignUp ? "Sign Up" : "Sign In"}
      </Text>
      {isSignUp && (
        <TextInput
          className="border-input bg-background text-foreground items-center rounded-md border px-3 text-lg leading-tight"
          value={name}
          onChangeText={setName}
          placeholder="Name"
          autoCapitalize="words"
        />
      )}
      <TextInput
        className="border-input bg-background text-foreground items-center rounded-md border px-3 text-lg leading-tight"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        className="border-input bg-background text-foreground items-center rounded-md border px-3 text-lg leading-tight"
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      {error && <Text className="text-destructive">{error}</Text>}
      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        className="bg-primary flex items-center rounded-sm p-2"
      >
        <Text>
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setIsSignUp(!isSignUp);
          setError(null);
        }}
      >
        <Text className="text-foreground text-center text-sm underline">
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function Index() {
  return (
    <SafeAreaView className="bg-background">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: "Home Page" }} />
      <View className="bg-background h-full w-full p-4">
        <Text className="text-foreground pb-2 text-center font-[Merriweather_700Bold] text-5xl font-bold">
          Wiki <Text className="text-primary">Anki</Text>
        </Text>

        <MobileAuth />

        <Link asChild href="/generate">
          <Pressable className="my-2 items-center">
            <Text className="text-primary text-lg font-semibold underline">
              Generate Flashcards from Wikipedia
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
