"use client";

import React, { useRef, useState } from "react";
import {
  FileText,
  Mic,
  Youtube,
  Table,
  Globe,
  HelpCircle,
  X,
} from "lucide-react";
import FAQGenerator from "./FAQGenerator";

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

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  message?: string;
}

const ChooseYourContentSource = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [showFaqInput, setShowFaqInput] = useState(false);

  // Replace with actual values from your app context
  const CURRENT_USER_ID = "user-123";
  const CURRENT_KB_ID = "kb-001";

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const updateProgress = (
    fileName: string,
    updates: Partial<UploadProgress>
  ) => {
    setUploadProgress((prev) =>
      prev.map((item) =>
        item.fileName === fileName ? { ...item, ...updates } : item
      )
    );
  };

  const handleClick = async (srcId: number) => {
    if (srcId === 1 && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (srcId === 5) {
      setShowUrlInput(true);
    } else if (srcId === 6) {
      setShowFaqInput(true);
    }
  };

  // Fixed file upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Initialize progress tracking
    const newProgress: UploadProgress[] = Array.from(files).map((file) => ({
      fileName: file.name,
      progress: 0,
      status: "uploading",
    }));
    setUploadProgress(newProgress);

    try {
      setLoading(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;

        try {
          // Step 1: Upload file to storage
          updateProgress(fileName, {
            status: "uploading",
            progress: 30,
            message: "Uploading file...",
          });

          const uploadFormData = new FormData();
          uploadFormData.append("userId", CURRENT_USER_ID);
          uploadFormData.append("knowledgebaseId", CURRENT_KB_ID);
          uploadFormData.append("files", file);

          console.log("Starting file upload for:", fileName);

          const uploadRes = await fetch("/api/ai/knowledgebase/upload", {
            method: "POST",
            body: uploadFormData,
            // Don't set Content-Type header for FormData - browser will set it automatically
          });

          console.log("Upload response status:", uploadRes.status);

          if (!uploadRes.ok) {
            let errorText = "Upload failed";
            try {
              const errorData = await uploadRes.json();
              errorText = errorData.error || `Upload failed for ${fileName}`;
            } catch (parseError) {
              errorText = `HTTP ${uploadRes.status}: ${uploadRes.statusText}`;
            }
            throw new Error(errorText);
          }

          const uploadData = await uploadRes.json();
          console.log("Upload response data:", uploadData);

          if (!uploadData.success) {
            throw new Error(
              uploadData.error || `Upload failed for ${fileName}`
            );
          }

          updateProgress(fileName, {
            progress: 60,
            message: "File uploaded, starting training...",
          });

          // Step 2: Start async training with file metadata
          const fileResult = uploadData.data.results.find(
            (r: any) => r.fileName === fileName
          );
          if (fileResult && fileResult.success) {
            const trainingRes = await fetch(
              "/api/ai/knowledgebase/training/async",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  knowledgebaseId: CURRENT_KB_ID,
                  fileId: fileResult.data.fileId,
                  fileName: fileResult.data.fileName,
                  fileType: fileResult.data.fileType,
                  fileSize: fileResult.data.fileSize,
                  supabaseBucket: fileResult.data.supabaseBucket,
                  storagePath: fileResult.data.storagePath,
                  publicUrl: fileResult.data.publicUrl,
                  metadata: {
                    originalName: file.name,
                    uploadMethod: "web_ui",
                    contentType: file.type,
                  },
                }),
              }
            );

            if (!trainingRes.ok) {
              const errorData = await trainingRes.json();
              throw new Error(
                errorData.error || `Training failed for ${fileName}`
              );
            }

            const trainingData = await trainingRes.json();

            if (trainingData.success) {
              updateProgress(fileName, {
                status: "processing",
                progress: 100,
                message: "Training started successfully",
              });

              showMessage("success", `Training started for ${fileName}`);
            } else {
              throw new Error(
                trainingData.error || `Training failed for ${fileName}`
              );
            }
          } else {
            throw new Error(`File upload result not found for ${fileName}`);
          }
        } catch (fileError) {
          console.error(`Error processing file ${fileName}:`, fileError);
          updateProgress(fileName, {
            status: "error",
            progress: 0,
            message:
              fileError instanceof Error
                ? fileError.message
                : "Processing failed",
          });
          showMessage(
            "error",
            `Failed to process ${fileName}: ${
              fileError instanceof Error ? fileError.message : "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Overall upload error:", error);
      showMessage("error", "Upload process failed");
    } finally {
      setLoading(false);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Web Scraper Handler (unchanged)
  const handleWebScrape = async (scrapeUrl: string) => {
    if (!scrapeUrl.trim()) {
      showMessage("error", "Please enter a valid URL");
      return;
    }

    try {
      new URL(scrapeUrl);
    } catch {
      showMessage(
        "error",
        "Please enter a valid URL (include http:// or https://)"
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/ai/knowledgebase/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: scrapeUrl,
          options: {
            includeLinks: true,
            includeImages: false,
            maxDepth: 1,
          },
          metadata: {
            addedBy: CURRENT_USER_ID,
            source: "web_scraper_ui",
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showMessage(
          "success",
          `Successfully scraped website: ${data.data.name}`
        );
        setShowUrlInput(false);
        setUrl("");
      } else {
        showMessage("error", data.error || "Web scraping failed");
      }
    } catch (err) {
      showMessage("error", "Web scraping failed - network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    handleWebScrape(url);
  };

  return (
    <div className="w-full py-10 text-center">
      <h2 className="text-white text-2xl md:text-3xl font-semibold">
        Choose Your Content Source
      </h2>
      <p className="mt-2 text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
        Select how you'd like to add knowledge to your AI agent. You can use
        multiple sources.
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.mp3,.wav,.csv"
      />

      {/* URL Input Modal */}
      {showUrlInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">
                Enter Website URL
              </h3>
              <button
                onClick={() => setShowUrlInput(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUrl} className="space-y-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ef3e6d]"
                required
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#ef3e6d] text-white rounded-lg hover:bg-[#d8355d] disabled:opacity-50 transition-colors"
                >
                  {loading ? "Scraping..." : "Scrape Website"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Generator Modal */}
      {showFaqInput && (
        <FAQGenerator
          setShowFaqInput={setShowFaqInput}
          loading={loading}
          setLoading={setLoading}
          showMessage={showMessage}
        />
      )}

      {/* Upload Progress and Status Messages (same as before) */}
      {/* ... */}

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
            <p className="mt-1 text-gray-400 text-sm text-center">
              {src.description}
            </p>
            <div className="mt-4">
              <span className="px-3 py-1 bg-[#262626] text-gray-200 text-xs rounded-full">
                {src.action}
              </span>
            </div>
          </div>
        ))}
      </div>

      {loading && uploadProgress.length === 0 && (
        <div className="mt-6 p-4 bg-[#1e1e1e] rounded-lg inline-block">
          <p className="text-gray-300">Processing... Please wait</p>
        </div>
      )}
    </div>
  );
};

export default ChooseYourContentSource;
