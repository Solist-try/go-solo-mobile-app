import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Outfit_400Regular, Outfit_500Medium } from "@expo-google-fonts/outfit";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const colors = {
  background: "#f7f5f2",
  card: "#fffcf8",
  ink: "#1a1a1a",
  inkSoft: "#6b6b6b",
  sage: "#dce5de",
  clay: "#eed9d2",
  gold: "#f3ead7",
  mist: "#eceeef",
  destructive: "#8f4d3a",
  border: "rgba(26, 26, 26, 0.1)",
};

export const fonts = {
  serif: "Fraunces_600SemiBold",
  body: "Outfit_400Regular",
  medium: "Outfit_500Medium",
};

export function useGoSoloFonts() {
  return useFonts({
    Fraunces_600SemiBold,
    Outfit_400Regular,
    Outfit_500Medium,
  });
}

export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const body = <View style={styles.column}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function TopBar({ title, back = false }: { title?: string; back?: boolean }) {
  return (
    <View style={styles.top}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      ) : (
        <View />
      )}
      {title ? <Text style={styles.topTitle}>{title}</Text> : null}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  tone = "sage",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: "sage" | "ink" | "quiet";
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, tone === "ink" ? styles.buttonInk : tone === "quiet" ? styles.buttonQuiet : styles.buttonSage, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, tone === "ink" && styles.buttonTextLight]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  secure = false,
  multiline = false,
  placeholder,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  multiline?: boolean;
  placeholder?: string;
} & Omit<TextInputProps, "value" | "onChangeText" | "secureTextEntry" | "multiline">) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        autoCapitalize={secure ? "none" : "sentences"}
        autoCorrect={!secure}
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.area]}
        {...rest}
      />
    </View>
  );
}

export function Card({ children, tone = "card", style }: { children: ReactNode; tone?: "card" | "sage" | "clay" | "gold" | "mist"; style?: ViewStyle }) {
  const background = tone === "card" ? colors.card : colors[tone];
  return <View style={[styles.card, { backgroundColor: background }, style]}>{children}</View>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Choice({
  label,
  selected,
  onPress,
  hint,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  hint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceOn]}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Pressable>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <Text style={styles.empty}>{children}</Text>;
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function Banner({ children }: { children: ReactNode }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{children}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <SafeAreaView style={[styles.safe, styles.center]}>
      <ActivityIndicator color={colors.ink} />
    </SafeAreaView>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={onPress} hitSlop={8}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 48 },
  column: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  center: { alignItems: "center", justifyContent: "center" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44 },
  back: { fontFamily: fonts.medium, color: colors.ink, fontSize: 16 },
  topTitle: { fontFamily: fonts.medium, color: colors.inkSoft, fontSize: 15 },
  title: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 46, color: colors.ink, letterSpacing: -0.6 },
  subtitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 18, lineHeight: 28, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.inkSoft },
  button: { minHeight: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  buttonSage: { backgroundColor: colors.sage },
  buttonInk: { backgroundColor: colors.ink },
  buttonQuiet: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  buttonText: { fontFamily: fonts.medium, fontSize: 17, color: colors.ink },
  buttonTextLight: { color: colors.background },
  disabled: { opacity: 0.5 },
  field: { gap: 8 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkSoft },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.ink,
  },
  area: { minHeight: 140, textAlignVertical: "top" },
  card: { borderRadius: 28, padding: 22, gap: 10 },
  section: { gap: 12, marginTop: 12 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: colors.ink },
  choice: { borderRadius: 22, backgroundColor: colors.card, padding: 16, gap: 4, borderWidth: 1, borderColor: "transparent" },
  choiceOn: { backgroundColor: colors.sage, borderColor: colors.ink },
  choiceLabel: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 24, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
  empty: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26, color: colors.inkSoft },
  error: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.destructive },
  banner: { backgroundColor: colors.gold, borderRadius: 18, padding: 14 },
  bannerText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  link: { fontFamily: fonts.body, fontSize: 17, color: colors.ink, textDecorationLine: "underline" },
});
