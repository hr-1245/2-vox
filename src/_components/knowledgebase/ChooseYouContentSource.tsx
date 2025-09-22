"use client";

import React, { useRef, useState } from "react";
import { FileText, Mic, Youtube, Table, Globe, HelpCircle, X, Trash2, Plus } from "lucide-react";

const sources = [
  { id: 1, title: "Upload Files", description: "PDF, Word, Excel, PowerPoint, and text files", action: "Drag & Drop", icon: <FileText className="w-8 h-8 text-gray-300" /> },
  { id: 2, title: "Audio Content", description: "MP3, WAV files with auto-transcription", action: "AI Transcription", icon: <Mic className="w-8 h-8 text-gray-300" /> },
  { id: 3, title: "YouTube Videos", description: "Import and transcribe video content", action: "URL Import", icon: <Youtube className="w-8 h-8 text-gray-300" /> },
  { id: 4, title: "CSV Data", description: "Structured data and spreadsheets", action: "Data Mapping", icon: <Table className="w-8 h-8 text-gray-300" /> },
  { id: 5, title: "Web Crawler", description: "Index websites and web pages", action: "Auto-Index", icon: <Globe className="w-8 h-8 text-gray-300" /> },
  { id: 6, title: "FAQ Generator", description: "Auto-generate from existing content", action: "AI Generated", icon: <HelpCircle className="w-8 h-8 text-gray-300" /> },
];

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}
interface FAQItem {
  question: string;
  answer: string;
  category: string;
}


const ChooseYourContentSource = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const [showFaqInput, setShowFaqInput] = useState(false);

  const [faqMode, setFaqMode] = useState<'manual' | 'auto'>('manual');
  const [faqs, setFaqs] = useState<FAQItem[]>([{ question: '', answer: '', category: 'general' }]);
  const [autoGenerateOptions, setAutoGenerateOptions] = useState({
    numberOfQuestions: 5,
    sourceContent: ''
  });
  // Replace with actual values from your app context
  const CURRENT_USER_ID = "user-123";
  const CURRENT_KB_ID = "kb-001";

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const updateProgress = (fileName: string, updates: Partial<UploadProgress>) => {
    setUploadProgress(prev => prev.map(item => 
      item.fileName === fileName ? { ...item, ...updates } : item
    ));
  };

  const handleClick = async (srcId: number) => {
    if (srcId === 1 && fileInputRef.current) {
      fileInputRef.current.click();
    }
    else if (srcId === 5) {
      setShowUrlInput(true);
    }
    else if (srcId === 6) {
      setShowFaqInput(true);
    }
  };
 const handleFaqGeneration = async () => {
    try {
      setLoading(true);

      const faqData = {
        knowledgebaseId: CURRENT_KB_ID,
        faqs: faqMode === 'manual' 
          ? faqs.filter(faq => faq.question.trim() && faq.answer.trim())
          : [],
        options: faqMode === 'auto' ? {
          autoGenerate: true,
          numberOfQuestions: autoGenerateOptions.numberOfQuestions,
          ...(autoGenerateOptions.sourceContent && { sourceContent: autoGenerateOptions.sourceContent })
        } : undefined
      };

      const res = await fetch("/api/ai/knowledgebase/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faqData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showMessage('success', data.data.message);
        setShowFaqInput(false);
        setFaqs([{ question: '', answer: '', category: 'general' }]);
        setAutoGenerateOptions({ numberOfQuestions: 5, sourceContent: '' });
      } else {
        showMessage('error', data.error || 'FAQ generation failed');
      }
    } catch (err) {
      showMessage('error', 'FAQ generation failed - network error');
    } finally {
      setLoading(false);
    }
  };

  // Add new FAQ field
  const addFaqField = () => {
    setFaqs([...faqs, { question: '', answer: '', category: 'general' }]);
  };

  // Remove FAQ field
  const removeFaqField = (index: number) => {
    if (faqs.length > 1) {
      setFaqs(faqs.filter((_, i) => i !== index));
    }
  };

  // Update FAQ field
  const updateFaqField = (index: number, field: keyof FAQItem, value: string) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setFaqs(updatedFaqs);
  };

  // Fixed file upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Initialize progress tracking
    const newProgress: UploadProgress[] = Array.from(files).map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setUploadProgress(newProgress);

    try {
      setLoading(true);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        
        try {
          // Step 1: Upload file to storage
          updateProgress(fileName, { status: 'uploading', progress: 30, message: 'Uploading file...' });
          
          const uploadFormData = new FormData();
          uploadFormData.append("userId", CURRENT_USER_ID);
          uploadFormData.append("knowledgebaseId", CURRENT_KB_ID);
          uploadFormData.append("files", file);

          console.log('Starting file upload for:', fileName);
          
          const uploadRes = await fetch("/api/ai/knowledgebase/upload", {
            method: "POST",
            body: uploadFormData,
            // Don't set Content-Type header for FormData - browser will set it automatically
          });

          console.log('Upload response status:', uploadRes.status);
          
          if (!uploadRes.ok) {
            let errorText = 'Upload failed';
            try {
              const errorData = await uploadRes.json();
              errorText = errorData.error || `Upload failed for ${fileName}`;
            } catch (parseError) {
              errorText = `HTTP ${uploadRes.status}: ${uploadRes.statusText}`;
            }
            throw new Error(errorText);
          }

          const uploadData = await uploadRes.json();
          console.log('Upload response data:', uploadData);
          
          if (!uploadData.success) {
            throw new Error(uploadData.error || `Upload failed for ${fileName}`);
          }

          updateProgress(fileName, { progress: 60, message: 'File uploaded, starting training...' });

          // Step 2: Start async training with file metadata
          const fileResult = uploadData.data.results.find((r: any) => r.fileName === fileName);
          if (fileResult && fileResult.success) {
            const trainingRes = await fetch("/api/ai/knowledgebase/training/async", {
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
                  uploadMethod: 'web_ui',
                  contentType: file.type
                }
              })
            });

            if (!trainingRes.ok) {
              const errorData = await trainingRes.json();
              throw new Error(errorData.error || `Training failed for ${fileName}`);
            }

            const trainingData = await trainingRes.json();
            
            if (trainingData.success) {
              updateProgress(fileName, { 
                status: 'processing', 
                progress: 100, 
                message: 'Training started successfully' 
              });
              
              showMessage('success', `Training started for ${fileName}`);
            } else {
              throw new Error(trainingData.error || `Training failed for ${fileName}`);
            }
          } else {
            throw new Error(`File upload result not found for ${fileName}`);
          }

        } catch (fileError) {
          console.error(`Error processing file ${fileName}:`, fileError);
          updateProgress(fileName, { 
            status: 'error', 
            progress: 0, 
            message: fileError instanceof Error ? fileError.message : 'Processing failed' 
          });
          showMessage('error', `Failed to process ${fileName}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      console.error("Overall upload error:", error);
      showMessage('error', 'Upload process failed');
    } finally {
      setLoading(false);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Web Scraper Handler (unchanged)
  const handleWebScrape = async (scrapeUrl: string) => {
    if (!scrapeUrl.trim()) {
      showMessage('error', 'Please enter a valid URL');
      return;
    }

    try {
      new URL(scrapeUrl);
    } catch {
      showMessage('error', 'Please enter a valid URL (include http:// or https://)');
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
            maxDepth: 1 
          },
          metadata: { 
            addedBy: CURRENT_USER_ID,
            source: "web_scraper_ui"
          }
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        showMessage('success', `Successfully scraped website: ${data.data.name}`);
        setShowUrlInput(false);
        setUrl("");
      } else {
        showMessage('error', data.error || 'Web scraping failed');
      }
    } catch (err) {
      showMessage('error', 'Web scraping failed - network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    handleWebScrape(url);
  };
  const handleSubmitFaq = (e: React.FormEvent) => {
    e.preventDefault();
    handleFaqGeneration();
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
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.mp3,.wav,.csv"
      />

      {/* URL Input Modal */}
      {showUrlInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">Enter Website URL</h3>
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
                  {loading ? 'Scraping...' : 'Scrape Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Generator Modal */}
      {showFaqInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-lg font-semibold">FAQ Generator</h3>
              <button 
                onClick={() => setShowFaqInput(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitFaq} className="space-y-6">
              {/* Mode Selection */}
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setFaqMode('manual')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    faqMode === 'manual' 
                      ? 'bg-[#ef3e6d] text-white' 
                      : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setFaqMode('auto')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    faqMode === 'auto' 
                      ? 'bg-[#ef3e6d] text-white' 
                      : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
                  }`}
                >
                  AI Generate
                </button>
              </div>

              {faqMode === 'manual' ? (
                /* Manual FAQ Entry */
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {faqs.map((faq, index) => (
                    <div key={index} className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-600">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-white font-medium">FAQ #{index + 1}</h4>
                        {faqs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFaqField(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFaqField(index, 'question', e.target.value)}
                          placeholder="Enter question..."
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#ef3e6d]"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFaqField(index, 'answer', e.target.value)}
                          placeholder="Enter answer..."
                          rows={3}
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#ef3e6d] resize-none"
                        />
                        <select
                          value={faq.category}
                          onChange={(e) => updateFaqField(index, 'category', e.target.value)}
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded text-white focus:outline-none focus:border-[#ef3e6d]"
                        >
                          <option value="general">General</option>
                          <option value="technical">Technical</option>
                          <option value="billing">Billing</option>
                          <option value="support">Support</option>
                          <option value="features">Features</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addFaqField}
                    className="flex items-center gap-2 text-[#ef3e6d] hover:text-[#d8355d] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another FAQ
                  </button>
                </div>
              ) : (
                /* Auto FAQ Generation */
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Number of Questions to Generate
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={autoGenerateOptions.numberOfQuestions}
                      onChange={(e) => setAutoGenerateOptions(prev => ({
                        ...prev,
                        numberOfQuestions: parseInt(e.target.value) || 5
                      }))}
                      className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded text-white focus:outline-none focus:border-[#ef3e6d]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Source Content (Optional)
                    </label>
                    <textarea
                      value={autoGenerateOptions.sourceContent}
                      onChange={(e) => setAutoGenerateOptions(prev => ({
                        ...prev,
                        sourceContent: e.target.value
                      }))}
                      placeholder="Paste content here to generate FAQs from specific text. Leave empty to use your knowledge base content."
                      rows={4}
                      className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#ef3e6d] resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      If left empty, the AI will generate FAQs based on your existing knowledge base content.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowFaqInput(false)}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (faqMode === 'manual' && !faqs.some(f => f.question.trim() && f.answer.trim()))}
                  className="flex-1 px-4 py-2 bg-[#ef3e6d] text-white rounded-lg hover:bg-[#d8355d] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Generating...' : faqMode === 'auto' ? 'Generate FAQs' : 'Add FAQs'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
            <p className="mt-1 text-gray-400 text-sm text-center">{src.description}</p>
            <div className="mt-4">
              <span className="px-3 py-1 bg-[#262626] text-gray-200 text-xs rounded-full">{src.action}</span>
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