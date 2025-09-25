interface NoDataOverlayProps {
  show: boolean;
}

export const NoDataOverlay = ({ show }: NoDataOverlayProps) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
      <div className="bg-opacity-95 pointer-events-none rounded-lg border border-gray-700 bg-[#1a2236] px-4 py-2 text-center text-gray-400 shadow-lg backdrop-blur-sm">
        No data available
      </div>
    </div>
  );
};
