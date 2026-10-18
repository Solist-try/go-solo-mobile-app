import { Image } from "react-native";

export function QuietPhoto({ uri, alt }: { uri?: string; alt?: string }) {
  if (!uri || !/^(https?:|file:|blob:|data:)/.test(uri)) return null;
  return (
    <Image
      source={{ uri }}
      style={{ width: 180, height: 120, borderRadius: 16 }}
      accessibilityLabel={alt || "A supporting photo"}
    />
  );
}
