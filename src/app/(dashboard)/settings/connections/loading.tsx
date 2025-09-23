import { Loading } from "@/components/global/loading";

export default function ConnectionsLoading() {
  return (
      <Loading
        message="Loading connection status..."
        size="md"
        className="h-full"
      />
  );
}