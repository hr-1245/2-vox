"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Mic,
  Youtube,
  Table,
  Globe,
  HelpCircle,
  X,
  Loader2,
  CheckCircle2,
  File,
} from "lucide-react";
import FAQGenerator from "./FAQGenerator";

interface ChooseYourContentSourceProps {
  onFilesUploaded: (files: string[]) => void;
}

interface FileWithStatus {
  id: number;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "processing" | "completed" | "failed";
  progress: number;
  knowledgeBaseId?: string;
}

const sources = [
  {
    id: 1,
    title: "Upload Files",
    description: "PDF, Word, Excel, PowerPoint, and text files",
    action: "Drag & Drop",
    icon: <FileText className="w-8 h-8 text-gray-300" />,
  },
  // {
  //   id: 2,
  //   title: "Audio Content",
  //   description: "MP3, WAV files with auto-transcription",
  //   action: "AI Transcription",
  //   icon: <Mic className="w-8 h-8 text-gray-300" />,
  // },
  // {
  //   id: 3,
  //   title: "YouTube Videos",
  //   description: "Import and transcribe video content",
  //   action: "URL Import",
  //   icon: <Youtube className="w-8 h-8 text-gray-300" />,
  // },
  // {
  //   id: 4,
  //   title: "CSV Data",
  //   description: "Structured data and spreadsheets",
  //   action: "Data Mapping",
  //   icon: <Table className="w-8 h-8 text-gray-300" />,
  // },
  // {
  //   id: 5,
  //   title: "Web Crawler",
  //   description: "Index websites and web pages",
  //   action: "Auto-Index",
  //   icon: <Globe className="w-8 h-8 text-gray-300" />,
  // },
  // {
  //   id: 6,
  //   title: "FAQ Generator",
  //   description: "Auto-generate from existing content",
  //   action: "AI Generated",
  //   icon: <HelpCircle className="w-8 h-8 text-gray-300" />,
  // },
];

export default function ChooseYourContentSource({
  onFilesUploaded,
}: ChooseYourContentSourceProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFaqInput, setShowFaqInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // validate uploaded files
  const validateFiles = (selectedFiles: FileList): File[] => {
    const supportedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "application/rtf",
    ];

    const validFiles: File[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (!supportedTypes.includes(file.type)) {
        setError(`❌ Unsupported file type: ${file.name}`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError(`❌ File too large (max 50MB): ${file.name}`);
        continue;
      }
      if (files.length + validFiles.length >= 3) {
        setError("❌ You can upload a maximum of 3 files.");
        break;
      }
      validFiles.push(file);
    }
    return validFiles;
  };

  // helper to convert file → base64
  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve(reader.result?.toString().split(",")[1] || "");
      reader.onerror = (err) => reject(err);
    });

  // upload file → then train
  const uploadFile = async (file: File, tempId: number) => {
    try {
      console.log("📂 Starting upload for:", file.name, {
        id: tempId,
        type: file.type,
        size: file.size,
      });

      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, status: "uploading" } : f))
      );

      console.log("🔄 Reading file as base64...");
      const base64Content = await readFileAsBase64(file);
      console.log(
        "✅ Finished reading file. Base64 length:",
        base64Content.length
      );

      console.log(
        "🚀 Sending upload request to /api/ai/knowledgebase/upload..."
      );
      const res = await fetch("/api/ai/knowledgebase/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: base64Content,
          mimeType: file.type,
          size: file.size,
          metadata: { source: "user_upload" },
        }),
      });

      console.log("📡 Upload response status:", res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Upload failed. Server response:", errText);
        throw new Error(errText);
      }

      // Mark as processing
      setFiles((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, status: "processing" } : f))
      );
      console.log("⚙️ File marked as processing...");

      const data = await res.json();
      console.log("✅ Upload response JSON:", data);

      const knowledgeBaseId = data.data?.id; // This is the ID you need for training
      console.log("📘 Extracted knowledgeBaseId:", knowledgeBaseId);

      // Mark as completed
      setFiles((prev) =>
        prev.map((f) =>
          f.id === tempId
            ? {
                ...f,
                status: "completed",
                knowledgeBaseId: knowledgeBaseId,
              }
            : f
        )
      );
      console.log("🎉 File marked as completed");

      // Notify parent component about the uploaded file
      if (knowledgeBaseId && onFilesUploaded) {
        console.log(
          "📤 Notifying parent about uploaded file ID:",
          knowledgeBaseId
        );
        onFilesUploaded([knowledgeBaseId]);
      }

      return knowledgeBaseId;
    } catch (err: any) {
      console.error("🔥 Upload failed:", err.message || err);
      setFiles((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, status: "failed" } : f))
      );
      setError(err.message || "Upload failed");
    }
  };

  // file select (click)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = validateFiles(e.target.files);
    if (!selected.length) return;

    const newFiles = selected.map((file, idx) => {
      const fileId = Date.now() + idx;
      uploadFile(file, fileId);
      return {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      } as FileWithStatus;
    });

    setFiles((prev) => [...prev, ...newFiles]);
  };

  // drag & drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = validateFiles(e.dataTransfer.files);
    if (!dropped.length) return;

    const newFiles = dropped.map((file, idx) => {
      const fileId = Date.now() + idx;
      uploadFile(file, fileId);
      return {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      } as FileWithStatus;
    });

    setFiles((prev) => [...prev, ...newFiles]);
  };

  // remove file
  const handleRemove = (fileId: number) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // click card handler
  const handleClick = (sourceId: number) => {
    if (sourceId === 1) {
      fileInputRef.current?.click();
    } else if (sourceId === 6) {
      setShowFaqInput(true);
    }
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
      {/* hidden input for file picker */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Source cards */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((src) => (
          <div
            key={src.id}
            className="bg-[#171717] border border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-md hover:shadow-lg transition-all duration-300 hover:border-[#ef3e6d] hover:bg-[#150d0e] cursor-pointer"
            onClick={() => handleClick(src.id)}
            onDragOver={(e) => src.id === 1 && e.preventDefault()}
            onDrop={(e) => src.id === 1 && handleDrop(e)}
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

      {/* error */}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* files list */}
      <div className="mt-6 space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between bg-[#262626] rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <File className="w-6 h-6 text-gray-300" />
              <div>
                <p className="text-white text-sm font-medium">{file.name}</p>
                <div className="flex mt-1">
                  <p className="text-gray-400 text-xs mr-1">{file.size} • </p>
                  {file.status === "uploading" && (
                    <div className="flex items-center text-gray-400 text-xs">
                      Uploading...
                    </div>
                  )}
                  {file.status === "processing" && (
                    <div className="flex items-center text-gray-400 text-xs">
                      Processing...
                    </div>
                  )}
                  {file.status === "completed" && (
                    <div className="flex items-center text-green-400 text-xs">
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {file.status === "uploading" && (
                <div className="flex items-center text-gray-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Uploading...
                </div>
              )}
              {file.status === "processing" && (
                <div className="flex items-center text-gray-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />{" "}
                  Processing...
                </div>
              )}
              {file.status === "completed" && (
                <div className="flex items-center text-green-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Ready
                </div>
              )}
              {/* Delete Button */}
              <button
                onClick={() => handleRemove(file.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ modal */}
      {showFaqInput && (
        <FAQGenerator
          isOpen={showFaqInput}
          onClose={() => setShowFaqInput(false)}
        />
      )}
    </div>
  );
}
