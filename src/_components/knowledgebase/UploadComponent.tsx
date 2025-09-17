"use client";

import React, { useState, useRef } from "react";
import { CloudUpload, File, CheckCircle2, Loader2 } from "lucide-react";

interface UploadFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "processing" | "completed";
}

const UploadComponent: React.FC = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      status: "uploading",
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload + processing
    newFiles.forEach((file) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "processing" } : f
          )
        );
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: "completed" } : f
            )
          );
        }, 2000);
      }, 2000);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0 && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      Array.from(droppedFiles).forEach((file) => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: fileInputRef.current } as any);
    }
  };

  return (
    <div className="w-full mx-auto p-4 md:p-6 bg-[#1E2430] rounded-xl shadow-md">
      <div className="flex space-x-4 mb-5">
        <div className="flex w-10 h-10 rounded-full bg-gray-700 justify-center items-center">
          <File />
        </div>

        <div>
          <h3 className="text-white text-lg font-semibold leading-tight">
            Upload Documents
          </h3>
          <span className="text-gray-400 text-xs md:text-sm">
            Drag and drop files or click to browse
          </span>
        </div>
      </div>

      {/* Upload Box */}
      <div
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <CloudUpload className="w-12 h-12 text-gray-300 mx-auto" />
        <p className="mt-3 text-gray-200 font-medium">
          Drop files here to upload
        </p>
        <p className="text-gray-400 text-sm">
          or click to browse from your computer
        </p>
        <button
          className="mt-4 px-5 py-2 bg-[#2A2F3A] text-white rounded-md hover:bg-[#343b4a]"
          type="button"
        >
          Browse Files
        </button>
        <p className="mt-2 text-xs text-gray-500">
          Supported: PDF, DOC, DOCX, TXT, RTF (Max 50MB per file)
        </p>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* File List */}
      <div className="mt-6 space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between bg-[#2A2F3A] rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <File className="w-6 h-6 text-gray-300" />
              <div>
                <p className="text-white text-sm font-medium">{file.name}</p>
                <p className="text-gray-400 text-xs">{file.size}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadComponent;
