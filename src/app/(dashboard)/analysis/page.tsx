import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

const Analysis = () => {
  return (
    <>
      <Typography variant="h2" className="mb-4">
        Performance Analysis
      </Typography>
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
    </>
  );
};

export default Analysis;
