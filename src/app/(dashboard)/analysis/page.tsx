import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Analysis = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        Performance Analysis
      </h1>
      <Card className="bg-[#1a2236] border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-white">Trading Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-gray-400">
            This page will contain detailed performance analysis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analysis;
