import { Card } from "@/components/ui/card";
import { Calendar, DollarSign, Percent, TrendingUp } from "lucide-react";

const SummaryStats = () => {
  return (
    <Card className="bg-[#1a2236] border-gray-800 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14192a] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">
              Portfolio Value
            </h3>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-white text-2xl font-bold mt-2">$25,650</p>
          <div className="flex items-center mt-2 text-green-400 text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+5.2% from last week</span>
          </div>
        </div>
        <div className="bg-[#14192a] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">Monthly P/L</h3>
            <Calendar className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-white text-2xl font-bold mt-2">+$1,250</p>
          <div className="flex items-center mt-2 text-green-400 text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+4.8% this month</span>
          </div>
        </div>
        <div className="bg-[#14192a] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">Yearly P/L</h3>
            <Calendar className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-white text-2xl font-bold mt-2">+$4,850</p>
          <div className="flex items-center mt-2 text-green-400 text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+18.9% this year</span>
          </div>
        </div>
        <div className="bg-[#14192a] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">Cash</h3>
            <Percent className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-white text-2xl font-bold mt-2">$8,250</p>
          <div className="flex items-center mt-2 text-blue-400 text-sm">
            <span>32.2% of portfolio</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SummaryStats;
