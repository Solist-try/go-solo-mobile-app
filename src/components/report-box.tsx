import { useState } from "react";
import { Button, ErrorNote, Field, Muted } from "@/components/ui";
import type { Report } from "@/domain/types";
import { useCommunity } from "@/state/community";

export function ReportBox({ targetType, targetId }: { targetType: Report["targetType"]; targetId: string }) {
  const { report, shell } = useCommunity();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  if (!shell.capabilities.reports && shell.profile) {
    return <Muted>Reporting opens once the shared safety update is on the community database.</Muted>;
  }
  if (!open) return <Button label="Report" tone="quiet" onPress={() => setOpen(true)} />;
  return (
    <>
      <Field label="What should a steward know?" value={reason} onChangeText={setReason} multiline />
      <ErrorNote>{error}</ErrorNote>
      {note ? <Muted>{note}</Muted> : null}
      <Button
        label="Send to the steward"
        onPress={async () => {
          const message = await report({ targetType, targetId, reason });
          if (message) setError(message);
          else {
            setNote("Sent. A steward will read it in context.");
            setReason("");
          }
        }}
      />
    </>
  );
}
