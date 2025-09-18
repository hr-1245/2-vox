import { Brain, Check, Loader2 } from "lucide-react";
import React from "react";

type Status = "completed" | "processing" | "pending";

interface Step {
  title: string;
  status: Status;
}

const steps: Step[] = [
  { title: "Text Extraction", status: "completed" },
  { title: "Content Chunking", status: "processing" },
  { title: "Vector Embedding", status: "pending" },
  { title: "Index Creation", status: "pending" },
];

const getStatusIcon = (status: Status) => {
  switch (status) {
    case "completed":
      return <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500" />;
    case "processing":
      return <Loader2 className="w-4 h-4 text-blue-400" />;
    default:
      return <span className="text-gray-400 text-xs md:text-sm">Pending</span>;
  }
};

const ProcessingStep: React.FC<{ step: Step }> = ({ step }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-sm sm:text-base md:text-lg text-white">
      {step.title}
    </span>
    <div className="flex items-center">{getStatusIcon(step.status)}</div>
  </div>
);

const AIProcessing: React.FC = () => {
  return (
    <div className="flex-1 bg-[#171717] rounded-2xl border border-gray-700 p-4 sm:p-6 md:p-8 mt-6 sm:mt-8 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex w-10 h-10 rounded-full bg-[#262626] justify-center items-center">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold leading-tight">
              AI Processing
            </h3>
            <span className="text-gray-400 text-xs sm:text-sm">
              Analyzing content structure
            </span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-6 sm:mt-8 space-y-3">
        {steps.map((step, i) => (
          <ProcessingStep key={i} step={step} />
        ))}
      </div>
    </div>
  );
};

export default AIProcessing;
