import { useState } from "react";
import { Button, Field, Muted } from "@/components/ui";
import { QuietPhoto } from "@/components/photo";
import { pickPhoto, takePhoto } from "@/components/media";
import type { MediaContext } from "@/api/contract";
import { useCommunity } from "@/state/community";

export type PhotoState = {
  mediaId: string;
  alt: string;
  clear: boolean;
  busy: boolean;
  blocked: boolean;
};

export const emptyPhoto: PhotoState = { mediaId: "", alt: "", clear: false, busy: false, blocked: false };

export function photoHold(photo: PhotoState): string {
  if (photo.busy) return "The photo is still on its way.";
  if (photo.blocked) return "The photo has not reached the house. Try again, or remove it.";
  return "";
}

export function PhotoDraft({
  context,
  existingUrl = "",
  existingAlt = "",
  onChange,
}: {
  context: MediaContext;
  existingUrl?: string;
  existingAlt?: string;
  onChange: (photo: PhotoState) => void;
}) {
  const { uploadMedia, removeMedia } = useCommunity();
  const [localUri, setLocalUri] = useState("");
  const [remoteUrl, setRemoteUrl] = useState(existingUrl);
  const [mediaId, setMediaId] = useState("");
  const [alt, setAlt] = useState(existingAlt);
  const [clear, setClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [pendingFile, setPendingFile] = useState<{ uri: string; mime: string } | null>(null);

  function publish(next: Partial<PhotoState> & { alt?: string }) {
    const photo: PhotoState = {
      mediaId: next.mediaId ?? mediaId,
      alt: next.alt ?? alt,
      clear: next.clear ?? clear,
      busy: next.busy ?? busy,
      blocked: next.blocked ?? blocked,
    };
    onChange(photo);
  }

  async function send(file: { uri: string; mime: string }, description: string) {
    setBusy(true);
    setBlocked(false);
    setError("");
    setProgress(0);
    publish({ busy: true, blocked: false });
    const result = await uploadMedia({
      uri: file.uri,
      mime: file.mime,
      context,
      alt: description,
      onProgress: setProgress,
    });
    setBusy(false);
    if ("error" in result) {
      setBlocked(true);
      setError(result.error);
      publish({ busy: false, blocked: true, mediaId: "", clear: false });
      return;
    }
    if (mediaId && mediaId !== result.media.id) void removeMedia(mediaId);
    setMediaId(result.media.id);
    setRemoteUrl(result.media.url);
    setBlocked(false);
    setClear(false);
    setPendingFile(null);
    publish({ mediaId: result.media.id, busy: false, blocked: false, clear: false, alt: description });
  }

  async function choose(camera: boolean) {
    const asset = camera ? await takePhoto() : await pickPhoto();
    if (!asset) return;
    const file = { uri: asset.uri, mime: asset.mimeType ?? "image/jpeg" };
    setLocalUri(asset.uri);
    setPendingFile(file);
    setClear(false);
    await send(file, alt);
  }

  async function remove() {
    const id = mediaId || (context === "profile" && remoteUrl ? "avatar" : "");
    if (id) {
      const message = await removeMedia(id);
      if (message) {
        setError(message);
        return;
      }
    }
    setLocalUri("");
    setRemoteUrl("");
    setMediaId("");
    setAlt("");
    setPendingFile(null);
    setBlocked(false);
    setClear(true);
    setError("");
    publish({ mediaId: "", alt: "", clear: true, busy: false, blocked: false });
  }

  const shown = localUri || (!clear ? remoteUrl : "");

  return (
    <>
      <QuietPhoto uri={shown} alt={alt} />
      {busy ? <Muted>{progress > 0 ? `Sending the photo… ${Math.round(progress * 100)}%` : "Sending the photo…"}</Muted> : null}
      {error ? <Muted>{error}</Muted> : null}
      <Button label={shown ? "Choose a different photo" : "Choose a photo"} tone="quiet" onPress={() => void choose(false)} disabled={busy} />
      <Button label="Take a photo" tone="quiet" onPress={() => void choose(true)} disabled={busy} />
      {blocked && pendingFile ? (
        <Button label="Try the photo again" tone="quiet" onPress={() => void send(pendingFile, alt)} disabled={busy} />
      ) : null}
      {shown ? (
        <Field
          label="Description"
          value={alt}
          onChangeText={(value) => {
            setAlt(value);
            publish({ alt: value });
          }}
        />
      ) : null}
      {shown ? <Button label="Remove photo" tone="quiet" onPress={() => void remove()} disabled={busy} /> : null}
    </>
  );
}
