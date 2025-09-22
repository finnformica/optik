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
  startTime: number; // Backend provides start timestamp
  endTime?: number; // Backend provides end timestamp
  alert: {
    variant: "default" | "destructive" | "success" | "warning" | "info";
    message: string;
  } | null;
}
