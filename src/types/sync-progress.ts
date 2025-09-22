export interface SyncProgressData {
  status:
    | "connecting"
    | "fetching"
    | "processing"
    | "saving"
    | "completed"
    | "failed";
  progress: number;
  message: string;
  total: number;
  processed: number;
  failed: number;
  remaining: number;
  startTime: string; // Backend provides start timestamp
  endTime: string | null; // Backend provides end timestamp
  createdAt: string;
  updatedAt: string;
}
