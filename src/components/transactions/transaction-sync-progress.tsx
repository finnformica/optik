import { CheckCircle, Clock, Database, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { SyncProgressData } from "@/types/sync-progress";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "connecting":
      return <Database className="w-5 h-5 text-blue-500 animate-pulse" />;
    case "fetching":
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    case "processing":
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    case "saving":
      return <Database className="w-5 h-5 text-blue-500 animate-pulse" />;
    case "completed":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    default:
      return <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />;
  }
};

const formatElapsedTime = (startTime: string, endTime: string | null) => {
  if (!endTime) return null;

  const elapsed = Math.floor(
    new Date(endTime).getTime() - new Date(startTime).getTime() / 1000
  );

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const getSyncCompletionAlert = (
  status: string,
  total: number,
  processed: number,
  failed: number
): {
  variant: "default" | "destructive" | "success" | "warning" | "info";
  message: string;
} | null => {
  if (status === "completed") {
    if (total === 0) {
      return {
        variant: "info",
        message: "Sync completed - no new transactions found.",
      };
    } else if (processed > 0 && failed === 0) {
      return {
        variant: "success",
        message: `Successfully processed ${total} transactions.`,
      };
    } else if (processed > 0 && failed > 0) {
      return {
        variant: "warning",
        message: `Successfully processed ${processed} transactions, but ${failed} failed. Check logs for details.`,
      };
    } else if (processed === 0 && failed > 0) {
      return {
        variant: "destructive",
        message: `Failed to process ${failed} transactions. Check logs for details.`,
      };
    } else {
      return {
        variant: "success",
        message: "Sync completed successfully.",
      };
    }
  } else if (status === "failed") {
    return {
      variant: "destructive",
      message: "Sync failed: Unknown error occurred",
    };
  }

  return null;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "connecting":
      return "Connecting to Broker";
    case "fetching":
      return "Fetching Data";
    case "processing":
      return "Processing Transactions";
    case "saving":
      return "Saving to Database";
    case "completed":
      return "Sync Complete";
    case "failed":
      return "Sync Failed";
    default:
      return "Syncing";
  }
};

const TransactionSyncProgress = ({
  showAlert,
  syncProgress,
}: {
  showAlert: boolean;
  syncProgress: SyncProgressData | null;
}) => {
  if (!syncProgress) return null;

  const {
    status,
    message,
    total,
    processed,
    failed,
    remaining,
    startTime,
    endTime,
  } = syncProgress;

  const isCompleted = status === "completed" || status === "failed";
  const elapsedTime = formatElapsedTime(startTime, endTime);
  const showProgress = total > 20 && !isCompleted;
  const alert = getSyncCompletionAlert(status, total, processed, failed);
  const progress = Math.round((processed / total) * 100);

  return (
    <div className="mb-6 space-y-4">
      {/* Progress Section - Show when appropriate */}
      {showProgress && (
        <div className="transition-all duration-500 ease-out transform opacity-100 translate-y-0">
          <Card className="bg-gray-900/80 border border-gray-700 overflow-hidden py-0">
            <CardContent className="p-6">
              {/* Header with status and elapsed time */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {getStatusLabel(status)}
                    </h3>
                    <p className="text-sm text-gray-400">{message}</p>
                  </div>
                </div>

                {elapsedTime && (
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {elapsedTime}
                  </div>
                )}
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {processed.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-1">
                    PROCESSED
                  </div>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {total.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-1">
                    TOTAL
                  </div>
                </div>
                <div className="bg-red-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {failed.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-1">
                    FAILED
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-300">
                    {remaining.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-1">
                    REMAINING
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {!isCompleted && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      Progress
                    </span>
                    <span className="text-sm font-medium text-gray-300">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 ease-out rounded-full bg-green-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showAlert && alert && (
        <Alert variant={alert.variant}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TransactionSyncProgress;
