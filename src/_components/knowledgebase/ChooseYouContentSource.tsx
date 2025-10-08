"use client";

import { useState, useRef } from "react";
import { FileText, File, X, Globe, CheckCircle } from "lucide-react";

interface ChooseYouContentSourceProps {
  onFilesSelected: (files: File[]) => void;
  onCrawlerLink: (link: string) => void;
  onFaqsSubmit: (faqs: { question: string; answer: string }[]) => void;
}

interface FilePreview {
  id: number;
  name: string;
  size: number;
  type: string;
  status: "ready";
}

interface CrawlerLink {
  id: number;
  url: string;
  status: "ready";
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  isEditing?: boolean;
}

const sources = [
  {
    id: 1,
    title: "Upload Files",
    description: "Upload and train your agent using PDF, DOCX, or CSV files.",
    action: "Drag & Drop or Browse Files",
    icon: <FileText className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 2,
    title: "Website Crawl",
    description:
      "Point your agent to a website and let it extract content automatically.",
    action: "Enter URL to Crawl",
    icon: <Globe className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 3,
    title: "Add FAQs",
    description:
      "Directly input frequently asked questions and answers for quick training.",
    action: "Start Adding FAQs",
    icon: <Globe className="w-8 h-8 text-gray-300" />,
  },
];

export default function ChooseYouContentSource({
  onFilesSelected,
  onCrawlerLink,
  onFaqsSubmit,
}: ChooseYouContentSourceProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [crawlerLinks, setCrawlerLinks] = useState<CrawlerLink[]>([]);
  const [crawlerLink, setCrawlerLink] = useState("");
  const [showCrawlerInput, setShowCrawlerInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [tempFaqs, setTempFaqs] = useState([{ question: "", answer: "" }]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileStoreRef = useRef<Map<string, File>>(new Map());

  // ✅ Validate files
  const validateFiles = (selectedFiles: FileList): File[] => {
    const supportedTypes = [
      "application/pdf",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const valid: File[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (fileStoreRef.current.has(file.name)) {
        setError(`⚠️ File already added: ${file.name}`);
        continue;
      }
      if (!supportedTypes.includes(file.type)) {
        setError(`❌ Unsupported file type: ${file.name}`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError(`❌ File too large (max 50MB): ${file.name}`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  };

  // ✅ Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const valid = validateFiles(e.target.files);
    if (files.length + valid.length > 3) {
      setError("⚠️ You can upload a maximum of 3 files only.");
      return;
    }

    const previews = valid.map((file, idx) => {
      const id = Date.now() + idx;
      fileStoreRef.current.set(file.name, file);
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "ready" as const,
      };
    });

    const updated = [...files, ...previews];
    setFiles(updated);
    onFilesSelected(Array.from(fileStoreRef.current.values()));
  };

  // ✅ Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = validateFiles(e.dataTransfer.files);
    if (files.length + dropped.length > 3) {
      setError("⚠️ You can upload a maximum of 3 files only.");
      return;
    }

    const previews = dropped.map((file, idx) => {
      const id = Date.now() + idx;
      fileStoreRef.current.set(file.name, file);
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "ready" as const,
      };
    });

    const updated = [...files, ...previews];
    setFiles(updated);
    onFilesSelected(Array.from(fileStoreRef.current.values()));
  };

  // ✅ Remove file
  const handleRemoveFile = (id: number, name: string) => {
    fileStoreRef.current.delete(name);
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    onFilesSelected(Array.from(fileStoreRef.current.values()));
  };

  // ✅ Handle source click
  const handleClick = (id: number) => {
    if (id === 1) fileInputRef.current?.click();
    if (id === 2) setShowCrawlerInput(true);
    if (id === 3) setShowFaqModal(true);
  };

  // ✅ Handle crawler submit
  const handleCrawlerSubmit = () => {
    const url = crawlerLink.trim();

    // 1️⃣ Check empty input
    if (!url) {
      setError("Please enter a website link.");
      return;
    }

    // 2️⃣ Validate URL format
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-./?%&=]*)?$/i;

    if (!urlPattern.test(url)) {
      setError("Please enter a valid website URL (e.g., https://example.com).");
      return;
    }

    // 3️⃣ Create new crawler link object
    const newLink = {
      id: Date.now(),
      url: url.startsWith("http") ? url : `https://${url}`, // ensure protocol
      status: "ready" as const,
    };

    // 4️⃣ Update state and reset input
    setCrawlerLinks((prev) => [...prev, newLink]);
    onCrawlerLink(newLink.url);
    setCrawlerLink("");
    setShowCrawlerInput(false);
    setError(null);
    setSuccess("✅ Website link added successfully!");

    // 5️⃣ Hide success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  // ✅ Remove file
  const handleRemoveLink = (id: number, url: string) => {
    setCrawlerLinks((prevLinks) => prevLinks.filter((link) => link.id !== id));
  };

  // ✅ Handle FAQ field changes
  const handleFaqChange = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  // ✅ Add new FAQ row
  const handleAddFaq = () => {
    setFaqs((prev) => [
      ...prev,
      { id: Date.now(), question: "", answer: "", isEditing: true },
    ]);
  };

  // ✅ Remove a FAQ row
  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  // ✅ Submit FAQs
  const handleFaqSubmit = () => {
    const validFaqs = tempFaqs
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f) => ({
        id: Date.now() + Math.random(),
        question: f.question.trim(),
        answer: f.answer.trim(),
        isEditing: false,
      }));

    if (validFaqs.length === 0) {
      setError("Please fill at least one question and answer.");
      return;
    }

    const updated = [...faqs, ...validFaqs];
    setFaqs(updated);
    onFaqsSubmit(updated);

    setTempFaqs([{ question: "", answer: "" }]);
    setShowFaqModal(false);
    setError(null);
    setSuccess("✅ FAQs added successfully!");
    setTimeout(() => setSuccess(null), 3000);
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

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.csv,.docx"
      />

      {/* Cards */}
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

      {/* ✅ Web crawler input */}
      {showCrawlerInput && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto bg-[#1e1e1e] p-4 rounded-xl border border-gray-700 shadow-lg">
          <input
            type="url"
            placeholder="Enter website link (e.g. https://example.com)"
            value={crawlerLink}
            onChange={(e) => setCrawlerLink(e.target.value)}
            className="flex-1 bg-[#2a2a2a] text-white text-sm rounded-lg px-4 py-2 focus:outline-none border border-gray-600 focus:border-[#ef3e6d] transition"
          />
          <button
            onClick={handleCrawlerSubmit}
            className="bg-[#ef3e6d] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#d6345f] transition"
          >
            Add
          </button>
        </div>
      )}

      {/* ✅ Feedback Messages */}
      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      {success && (
        <p className="text-green-400 text-sm mt-3 flex items-center justify-center gap-1">
          <CheckCircle className="w-4 h-4" /> {success}
        </p>
      )}

      {/* ✅ File list */}
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
                <p className="text-gray-400 text-xs mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="bg-yellow-600/20 text-yellow-400 text-xs font-medium px-3 py-1 rounded-full">
                Ready to Upload
              </span>
              <button
                onClick={() => handleRemoveFile(file.id, file.name)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {/* ✅ Crawler links list */}
        {crawlerLinks.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between bg-[#262626] rounded-lg p-4 mb-2"
          >
            <div className="flex items-center space-x-3">
              <Globe className="w-6 h-6 text-gray-300" />
              <p className="text-white text-sm font-medium">{link.url}</p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="bg-yellow-600/20 text-yellow-400 text-xs font-medium px-3 py-1 rounded-full">
                Ready to Crawl
              </span>

              {/* ❌ Cross button */}
              <button
                onClick={() => handleRemoveLink(link.id, link.url)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6 w-full max-w-lg relative shadow-xl">
            <button
              onClick={() => setShowFaqModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-white text-xl font-semibold mb-4">Add FAQs</h3>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-[#262626] p-4 rounded-lg border border-gray-600"
                >
                  <input
                    type="text"
                    placeholder="Enter question"
                    value={faq.question}
                    onChange={(e) =>
                      handleFaqChange(index, "question", e.target.value)
                    }
                    className="w-full bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 mb-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                  />
                  <textarea
                    placeholder="Enter answer"
                    value={faq.answer}
                    onChange={(e) =>
                      handleFaqChange(index, "answer", e.target.value)
                    }
                    className="w-full bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                    rows={3}
                  />
                  {faqs.length > 1 && (
                    <button
                      onClick={() => handleRemoveFaq(index)}
                      className="text-xs text-red-400 mt-2 hover:text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-5">
              <button
                onClick={handleAddFaq}
                className="text-sm text-[#ef3e6d] font-medium hover:underline"
              >
                + Add Another
              </button>
              <button
                onClick={handleFaqSubmit}
                className="bg-[#ef3e6d] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#d6345f] transition"
              >
                Save FAQs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FAQs List */}
      {faqs.length > 0 && (
        <div className="mt-6 space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-[#262626] rounded-lg p-4 border border-gray-700"
            >
              {faq.isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) =>
                      setFaqs((prev) =>
                        prev.map((f) =>
                          f.id === faq.id
                            ? { ...f, question: e.target.value }
                            : f
                        )
                      )
                    }
                    className="w-full bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) =>
                      setFaqs((prev) =>
                        prev.map((f) =>
                          f.id === faq.id ? { ...f, answer: e.target.value } : f
                        )
                      )
                    }
                    className="w-full bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      onClick={() =>
                        setFaqs((prev) =>
                          prev.map((f) =>
                            f.id === faq.id ? { ...f, isEditing: false } : f
                          )
                        )
                      }
                      className="bg-[#ef3e6d] text-white text-xs px-4 py-1 rounded-lg hover:bg-[#d6345f]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() =>
                        setFaqs((prev) =>
                          prev.map((f) =>
                            f.id === faq.id ? { ...f, isEditing: false } : f
                          )
                        )
                      }
                      className="text-gray-400 text-xs hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white text-sm font-semibold">
                      Q: {faq.question}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      A: {faq.answer}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setFaqs((prev) =>
                          prev.map((f) =>
                            f.id === faq.id ? { ...f, isEditing: true } : f
                          )
                        )
                      }
                      className="text-gray-400 hover:text-blue-400"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() =>
                        setFaqs((prev) => prev.filter((f) => f.id !== faq.id))
                      }
                      className="text-gray-400 hover:text-red-500"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* ✅ FAQs List */}
      {faqs.length > 0 && (
        <div className="mt-6 space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-[#262626] rounded-lg p-4 border border-gray-700"
            >
              {faq.isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) =>
                      setFaqs((prev) =>
                        prev.map((f) =>
                          f.id === faq.id
                            ? { ...f, question: e.target.value }
                            : f
                        )
                      )
                    }
                    className="w-full bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) =>
                      setFaqs((prev) =>
                        prev.map((f) =>
                          f.id === faq.id ? { ...f, answer: e.target.value } : f
                        )
                      )
                    }
                    className="w-full bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-[#ef3e6d] outline-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      onClick={() =>
                        setFaqs((prev) =>
                          prev.map((f) =>
                            f.id === faq.id ? { ...f, isEditing: false } : f
                          )
                        )
                      }
                      className="bg-[#ef3e6d] text-white text-xs px-4 py-1 rounded-lg hover:bg-[#d6345f]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() =>
                        setFaqs((prev) =>
                          prev.map((f) =>
                            f.id === faq.id ? { ...f, isEditing: false } : f
                          )
                        )
                      }
                      className="text-gray-400 text-xs hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white text-sm font-semibold">
                      Q: {faq.question}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      A: {faq.answer}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setFaqs((prev) =>
                          prev.map((f) =>
                            f.id === faq.id ? { ...f, isEditing: true } : f
                          )
                        )
                      }
                      className="text-gray-400 hover:text-blue-400"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() =>
                        setFaqs((prev) => prev.filter((f) => f.id !== faq.id))
                      }
                      className="text-gray-400 hover:text-red-500"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
