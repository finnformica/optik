interface NoDataOverlayProps {
  show: boolean;
}

export const NoDataOverlay = ({ show }: NoDataOverlayProps) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 backdrop-blur-[2px] flex items-center justify-center">
      <div className="text-center text-gray-400 bg-[#1a2236] bg-opacity-95 px-4 py-2 rounded-lg border border-gray-700 backdrop-blur-sm shadow-lg pointer-events-none">
        No data available
      </div>
    </div>
  );
};
