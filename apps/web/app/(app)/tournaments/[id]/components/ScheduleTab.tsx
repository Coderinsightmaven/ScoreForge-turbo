"use client";

export function ScheduleTab(_props: {
  tournamentId: string;
  canManage: boolean;
  availableCourts?: string[];
  tournamentStatus: "draft" | "active" | "completed" | "cancelled";
  startDate?: number;
  defaultMatchDuration?: number;
  scheduleBuffer?: number;
}): React.ReactNode {
  return <div>Schedule tab placeholder</div>;
}
