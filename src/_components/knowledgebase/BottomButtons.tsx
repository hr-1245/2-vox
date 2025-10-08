import React, { FC } from "react";
import { Save, Eye, ArrowLeft, ArrowRight } from "lucide-react";

interface BottomButtonsProps {
  handleAddKnowledgeBase: () => void;
}

const BottomButtons: FC<BottomButtonsProps> = ({ handleAddKnowledgeBase }) => {
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
          className="flex items-center justify-center gap-2 sm:px-6 py-3 bg-[#262626] text-gray-200 text-sm font-medium rounded-lg hover:bg-[#ef3e6d] transition w-full sm:w-auto cursor-pointer"
        >
          Add Knowledge Base
          {/* <ArrowRight className="w-4 h-4" /> */}
        </button>
      </div>
    </div>
  );
};

export default BottomButtons;
