import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, ErrorNote, Field, Muted, Screen, TextLink, Title, TopBar } from "@/components/ui";
import { RichText } from "@/components/rich-text";
import { REACTIONS } from "@/domain/types";
import { formatDay } from "@/domain/format";
import { useCommunity } from "@/state/community";
import { ReportBox } from "@/components/report-box";

export default function CampfireDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const community = useCommunity();
  const post = community.shell.world.campfire.find((item) => item.id === id);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  if (!post) {
    return (
      <Screen>
        <TopBar back />
        <Title>This note is not here.</Title>
      </Screen>
    );
  }
  const comments = community.shell.world.comments.filter((item) => item.targetType === "campfire" && item.targetId === post.id && !item.hidden);
  const mine = community.shell.world.reactions.find((item) => item.userId === community.user?.id && item.targetId === post.id);

  return (
    <Screen>
      <TopBar back title="Campfire" />
      {post.pinned ? <Muted>{community.content.mobile!.pinnedLabels.campfire}</Muted> : null}
      <Title>{post.title || "Around the table"}</Title>
      <Muted>
        {community.nameOf(post.authorId)} · {formatDay(post.createdAt)}
      </Muted>
      <RichText value={post.body} />
      {post.imageAlt ? <Muted>Photo: {post.imageAlt}</Muted> : null}
      <Body>A named response, not a count.</Body>
      {REACTIONS.map((reaction) => (
        <TextLink
          key={reaction.id}
          label={mine?.kind === reaction.id ? `${reaction.label} · yours` : reaction.label}
          onPress={() => void community.react("campfire", post.id, mine?.kind === reaction.id ? null : reaction.id)}
        />
      ))}
      {community.user?.role === "admin" ? (
        <Button
          label={post.pinned ? "Unpin" : "Pin as welcome"}
          tone="quiet"
          onPress={() => void community.stewardModerate({ kind: "campfire", id: post.id, pinned: !post.pinned })}
        />
      ) : null}
      {post.pinned ? (
        <TextLink label="Hide this welcome for now" onPress={() => void community.dismissPin("campfire", post.id)} />
      ) : null}
      <Title>Replies</Title>
      {comments.map((comment) => (
        <Card key={comment.id}>
          <Muted>{community.nameOf(comment.authorId)}</Muted>
          <RichText value={comment.body} />
        </Card>
      ))}
      <Field label="Reply" value={reply} onChangeText={setReply} multiline />
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Leave a reply"
        onPress={async () => {
          const message = await community.comment("campfire", post.id, reply);
          if (message) setError(message);
          else setReply("");
        }}
      />
      {community.user && community.user.id !== post.authorId ? (
        <>
          <ReportBox targetType="campfire" targetId={post.id} />
          <TextLink label="Block this member" onPress={() => void community.block(post.authorId)} />
        </>
      ) : null}
      <TextLink label="Their garden" onPress={() => router.push(`/garden/${post.authorId}`)} />
    </Screen>
  );
}
