import React, { FC } from "react";
import { Save, Eye, ArrowLeft, ArrowRight } from "lucide-react";

interface BottomButtonsProps {
  handleAddKnowledgeBase: () => void;
  loading: boolean;
}

const BottomButtons: FC<BottomButtonsProps> = ({
  handleAddKnowledgeBase,
  loading,
}) => {
  return (
    <div className="w-full mt-10 flex flex-col sm:flex-row sm:justify-between gap-4">
      {/* Left Group */}
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        {/* <button className="flex items-center justify-center gap-2 sm:px-6 py-3 bg-[#262626] text-gray-200 text-sm font-medium rounded-lg hover:bg-[#ef3e6d] transition w-full sm:w-auto cursor-pointer">
          <Save className="w-4 h-4" />
          Save as Draft
        </button>
        <button className="flex items-center justify-center gap-2 sm:px-6 py-3 bg-[#262626] text-gray-200 text-sm font-medium rounded-lg hover:bg-[#ef3e6d] transition w-full sm:w-auto cursor-pointer">
          <Eye className="w-4 h-4" />
          Preview Agent
        </button> */}
      </div>

      {/* Right Group */}
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        {/* <button className="flex items-center justify-center gap-2 sm:px-6 py-3 bg-[#262626] text-gray-200 text-sm font-medium rounded-lg hover:bg-[#ef3e6d] transition w-full sm:w-auto cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Previous Step
        </button> */}
        <button
          onClick={handleAddKnowledgeBase}
          disabled={loading}
          className="flex items-center justify-center gap-2 sm:px-6 py-3 bg-[#262626] text-gray-200 text-sm font-medium rounded-lg hover:bg-[#ef3e6d] transition w-full sm:w-auto cursor-pointer disabled:opacity-70"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              Adding Knowledge Base
            </>
          ) : (
            "Add Knowledge Base"
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomButtons;
