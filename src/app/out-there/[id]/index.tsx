import { router, useLocalSearchParams } from "expo-router";
import { Fragment, useState } from "react";
import { Body, Button, ErrorNote, Field, Muted, Screen, TextLink, Title, TopBar } from "@/components/ui";
import { QuietPhoto } from "@/components/photo";
import { emptyPhoto, photoHold, PhotoDraft, type PhotoState } from "@/components/photo-draft";
import { RichText } from "@/components/rich-text";
import { ReportBox } from "@/components/report-box";
import { formatDay } from "@/domain/format";
import { useCommunity } from "@/state/community";

export default function StoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const community = useCommunity();
  const story = community.shell.world.stories.find((item) => item.id === id);
  const [reply, setReply] = useState("");
  const [photo, setPhoto] = useState<PhotoState>(emptyPhoto);
  const [photoKey, setPhotoKey] = useState(0);
  const [error, setError] = useState("");
  if (!story) {
    return (
      <Screen>
        <TopBar back />
        <Title>This story is not here.</Title>
      </Screen>
    );
  }
  const legacy = [story.expecting, story.actuallyHappened].filter(Boolean);
  const comments = community.shell.world.comments.filter((item) => item.targetType === "out-there" && item.targetId === story.id);
  return (
    <Screen>
      <TopBar back title="Out There" />
      {story.example ? <Muted>An idea, not something a member did.</Muted> : null}
      {story.pinned ? <Muted>{community.content.mobile!.pinnedLabels.story}</Muted> : null}
      <Title>{story.title}</Title>
      <Muted>
        {community.nameOf(story.authorId)} · {formatDay(story.createdAt)}
      </Muted>
      <RichText value={story.whatDidYouDo} />
      <QuietPhoto uri={story.imageUrl} alt={story.imageAlt} />
      {legacy.length ? (
        <>
          <Muted>An earlier story kept its questions.</Muted>
          {legacy.map((part) => (
            <Body key={part}>{part}</Body>
          ))}
        </>
      ) : null}
      {story.imageAlt ? <Muted>Photo: {story.imageAlt}</Muted> : null}
      {community.user?.id === story.authorId ? <TextLink label="Edit" onPress={() => router.push(`/out-there/${story.id}/edit`)} /> : null}
      {comments.map((comment) => (
        <Fragment key={comment.id}>
          <Body>
            {community.nameOf(comment.authorId)}: {comment.body}
          </Body>
          <QuietPhoto uri={comment.imageUrl} alt={comment.imageAlt} />
        </Fragment>
      ))}
      <Field label="Reply" value={reply} onChangeText={setReply} multiline />
      <PhotoDraft key={photoKey} context="comment" onChange={setPhoto} />
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Leave a reply"
        onPress={async () => {
          const held = photoHold(photo);
          if (held) {
            setError(held);
            return;
          }
          const message = await community.comment("out-there", story.id, reply, photo.mediaId || undefined, photo.alt);
          if (message) setError(message);
          else {
            setReply("");
            setPhoto(emptyPhoto);
            setPhotoKey((item) => item + 1);
          }
        }}
      />
      {community.user && community.user.id !== story.authorId ? <ReportBox targetType="out-there" targetId={story.id} /> : null}
    </Screen>
  );
}
