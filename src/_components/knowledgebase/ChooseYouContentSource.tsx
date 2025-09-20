"use client";

import React, { useRef, useState } from "react";
import { FileText, Mic, Youtube, Table, Globe, HelpCircle } from "lucide-react";

const sources = [
  { id: 1, title: "Upload Files", description: "PDF, Word, Excel, PowerPoint, and text files", action: "Drag & Drop", icon: <FileText className="w-8 h-8 text-gray-300" /> },
  { id: 2, title: "Audio Content", description: "MP3, WAV files with auto-transcription", action: "AI Transcription", icon: <Mic className="w-8 h-8 text-gray-300" /> },
  { id: 3, title: "YouTube Videos", description: "Import and transcribe video content", action: "URL Import", icon: <Youtube className="w-8 h-8 text-gray-300" /> },
  { id: 4, title: "CSV Data", description: "Structured data and spreadsheets", action: "Data Mapping", icon: <Table className="w-8 h-8 text-gray-300" /> },
  { id: 5, title: "Web Crawler", description: "Index websites and web pages", action: "Auto-Index", icon: <Globe className="w-8 h-8 text-gray-300" /> },
  { id: 6, title: "FAQ Generator", description: "Auto-generate from existing content", action: "AI Generated", icon: <HelpCircle className="w-8 h-8 text-gray-300" /> },
];

const ChooseYouContentSource = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = (srcId: number) => {
    if (srcId === 1 && fileInputRef.current) {
      fileInputRef.current.click(); // File Upload
    }
    if (srcId === 5) {
      handleWebScrape(); // Web Scraper
    }
  };

  // --- 1. FILE UPLOAD PLACEHOLDER (different endpoint) ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append("userId", "user-123");
    formData.append("knowledgebaseId", "kb-001");

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      setLoading(true);
      const res = await fetch("/api/ai/knowledgebase/upload", {
        method: "POST",
        body: formData, // ✅ file upload uses FormData
      });
      const data = await res.json();
      console.log("Upload response ✅", data);
    } catch (err) {
      console.error("Upload error ❌", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. WEB SCRAPER BINDED TO scrape/route.ts ---
  const handleWebScrape = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/knowledgebase/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://example.com", // <-- you can make this user input later
          options: { includeLinks: true, includeImages: true },
          metadata: { addedBy: "user-123" }
        }),
      });

      const data = await res.json();
      console.log("Web scrape response ✅", data);
    } catch (err) {
      console.error("Web scrape error ❌", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-10 text-center">
      <h2 className="text-white text-2xl md:text-3xl font-semibold">
        Choose Your Content Source
      </h2>
      <p className="mt-2 text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
        Select how you'd like to add knowledge to your AI agent. You can use multiple sources.
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((src) => (
          <div
            key={src.id}
            onClick={() => handleClick(src.id)}
            className="bg-[#171717] border border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-md hover:shadow-lg transition-all duration-300 hover:border-[#ef3e6d] hover:bg-[#150d0e] cursor-pointer"
          >
            <div className="flex w-14 h-14 rounded-lg bg-[#262626] justify-center items-center mb-4">
              {src.icon}
            </div>
            <h3 className="text-white text-lg font-semibold">{src.title}</h3>
            <p className="mt-1 text-gray-400 text-sm text-center">{src.description}</p>
            <div className="mt-4">
              <span className="px-3 py-1 bg-[#262626] text-gray-200 text-xs rounded-full">{src.action}</span>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-gray-300 mt-4">Processing...</p>}
    </div>
  );
};

export default ChooseYouContentSource;
