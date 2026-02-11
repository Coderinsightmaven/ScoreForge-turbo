import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@repo/convex";
import { toast } from "sonner";
import { getDisplayMessage } from "@/lib/errors";
import type { Id } from "@repo/convex/dataModel";

type Props = {
  matchId: string;
  scheduledTime?: number;
  canEdit: boolean;
  court?: string;
};

function formatDateTimeInput(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function parseDateTimeInput(value: string): number | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const dateParts = datePart.split("-");
  const timeParts = timePart.split(":");
  if (dateParts.length < 3 || timeParts.length < 2) return null;
  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]);
  const day = Number(dateParts[2]);
  const hour = Number(timeParts[0]);
  const minute = Number(timeParts[1]);
  if ([year, month, day, hour, minute].some((item) => Number.isNaN(item))) {
    return null;
  }
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function formatDisplayTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ScheduledTimeInfo({ matchId, scheduledTime, canEdit, court }: Props) {
  const scheduleMatch = useMutation(api.matches.scheduleMatch);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(scheduledTime ? formatDateTimeInput(scheduledTime) : "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(scheduledTime ? formatDateTimeInput(scheduledTime) : "");
  }, [scheduledTime]);

  const handleStartEdit = () => {
    if (!scheduledTime) {
      setValue(formatDateTimeInput(Date.now()));
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    const timestamp = parseDateTimeInput(value);
    if (!timestamp) {
      toast.error("Select a valid start time");
      return;
    }

    setSaving(true);
    try {
      await scheduleMatch({
        matchId: matchId as Id<"matches">,
        scheduledTime: timestamp,
        court,
      });
      setIsEditing(false);
    } catch (err) {
      toast.error(getDisplayMessage(err) || "Failed to schedule match");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setValue(scheduledTime ? formatDateTimeInput(scheduledTime) : "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Scheduled
        </span>
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-52 px-2 py-1 text-sm bg-bg-secondary border border-border rounded focus:border-brand focus:outline-none text-text-primary"
            disabled={saving}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-2 py-1 text-xs font-medium text-text-inverse bg-brand rounded hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            {saving ? "..." : "Save"}
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-1 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Scheduled</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-primary">
          {scheduledTime ? formatDisplayTime(scheduledTime) : "Not scheduled"}
        </span>
        {canEdit && (
          <button
            onClick={handleStartEdit}
            className="text-xs text-brand hover:text-brand-hover transition-colors"
          >
            {scheduledTime ? "Edit" : "Set"}
          </button>
        )}
      </div>
    </div>
  );
}
