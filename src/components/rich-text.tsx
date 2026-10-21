import { Text, View } from "react-native";
import { safeLink } from "@/domain/policy";
import { colors, fonts } from "./ui";

type Block =
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/\S+)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={index} style={{ fontFamily: fonts.medium }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <Text key={index} style={{ fontStyle: "italic" }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    const href = safeLink(part);
    if (href) {
      return (
        <Text key={index} style={{ textDecorationLine: "underline" }}>
          {href}
        </Text>
      );
    }
    return <Text key={index}>{part}</Text>;
  });
}

function parse(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (list) {
      blocks.push({ type: "list", ...list });
      list = null;
    }
  };
  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const item = (bullet ?? numbered)![1];
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push(item);
      continue;
    }
    flush();
    if (quote) {
      if (quote[1]) blocks.push({ type: "quote", text: quote[1] });
      continue;
    }
    if (line.trim()) blocks.push({ type: "paragraph", text: line.trim() });
  }
  flush();
  return blocks;
}

export function RichText({ value }: { value: string }) {
  return (
    <View style={{ gap: 10 }}>
      {parse(value).map((block, index) => {
        if (block.type === "quote") {
          return (
            <Text key={index} style={{ fontFamily: fonts.serif, fontSize: 20, lineHeight: 28, color: colors.ink, paddingLeft: 12 }}>
              {inline(block.text)}
            </Text>
          );
        }
        if (block.type === "list") {
          return (
            <View key={index} style={{ gap: 6 }}>
              {block.items.map((item, itemIndex) => (
                <Text key={itemIndex} style={{ fontFamily: fonts.body, fontSize: 17, lineHeight: 26, color: colors.ink }}>
                  {block.ordered ? `${itemIndex + 1}. ` : "• "}
                  {inline(item)}
                </Text>
              ))}
            </View>
          );
        }
        return (
          <Text key={index} style={{ fontFamily: fonts.body, fontSize: 17, lineHeight: 26, color: colors.ink }}>
            {inline(block.text)}
          </Text>
        );
      })}
    </View>
  );
}
