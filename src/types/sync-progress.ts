export type SyncStatus =
  | "pending"
  | "fetching"
  | "processing"
  | "completed"
  | "failed";

export interface SyncProgressData {
  status: SyncStatus;
  progress: number;
  total: number;
  processed: number;
  failed: number;
  remaining: number;
  startTime: string; // Backend provides start timestamp
  endTime: string | null; // Backend provides end timestamp
  createdAt: string;
  updatedAt: string;
}
