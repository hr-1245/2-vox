import React from "react";
import { FileText, Mic, Youtube, Table, Globe, HelpCircle } from "lucide-react";

const sources = [
  {
    id: 1,
    title: "Upload Files",
    description: "PDF, Word, Excel, PowerPoint, and text files",
    action: "Drag & Drop",
    icon: <FileText className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 2,
    title: "Audio Content",
    description: "MP3, WAV files with auto-transcription",
    action: "AI Transcription",
    icon: <Mic className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 3,
    title: "YouTube Videos",
    description: "Import and transcribe video content",
    action: "URL Import",
    icon: <Youtube className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 4,
    title: "CSV Data",
    description: "Structured data and spreadsheets",
    action: "Data Mapping",
    icon: <Table className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 5,
    title: "Web Crawler",
    description: "Index websites and web pages",
    action: "Auto-Index",
    icon: <Globe className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 6,
    title: "FAQ Generator",
    description: "Auto-generate from existing content",
    action: "AI Generated",
    icon: <HelpCircle className="w-8 h-8 text-gray-300" />,
  },
];

const ChooseYouContentSource = () => {
  return (
    <div className="w-full py-10 text-center">
      {/* Heading */}
      <h2 className="text-white text-2xl md:text-3xl font-semibold">
        Choose Your Content Source
      </h2>
      <p className="mt-2 text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
        Select how you'd like to add knowledge to your AI agent. You can use
        multiple sources.
      </p>

      {/* Grid */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((src) => (
          <div
            key={src.id}
            className="bg-[#2A2F3A] border border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            {/* Icon */}
            <div className="flex w-14 h-14 rounded-lg bg-[#1E2430] justify-center items-center mb-4">
              {src.icon}
            </div>

            {/* Title */}
            <h3 className="text-white text-lg font-semibold">{src.title}</h3>
            <p className="mt-1 text-gray-400 text-sm text-center">
              {src.description}
            </p>

            {/* Action Button */}
            <div className="mt-4">
              <span className="px-3 py-1 bg-[#3A404D] text-gray-200 text-xs rounded-full">
                {src.action}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChooseYouContentSource;
