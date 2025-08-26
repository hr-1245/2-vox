'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  KnowledgeBase, 
  KnowledgeBaseInsert, 
  KnowledgeBasesResponse 
} from '@/utils/database/knowledgebase';
import { 
  KB_SETTINGS, 
  FORM_TYPE_TO_DB_TYPE, 
  CATEGORY_TO_TYPE,
  convertFormTypeToDBType,
  getCategoryTypeFilter,
  type FormKBType,
  type CategoryFilter
} from '@/utils/ai/knowledgebaseSettings';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';
import { 
  FileText, 
  Upload, 
  HelpCircle, 
  Trash2, 
  Plus,
  X,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  BookOpen,
  Settings,
  Search,
  Filter,
  Calendar,
  Database,
  User,
  MessageSquare,
  FileQuestion,
  Zap,
  Eye,
  BarChart3,
  Star,
  Clock,
  Archive,
  SortAsc
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateKnowledgeBaseForm {
  name: string;
  summary: string;
  type: 'file' | 'faq' | 'web';
  files?: File[];
  faqs?: Array<{ question: string; answer: string; }>;
  url?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// Utility functions - moved outside component scope
const getTypeIcon = (type: number) => {
  if (type === KB_SETTINGS.KB_CONVERSATION.type) return <MessageSquare className="h-4 w-4" />;
  if (type === KB_SETTINGS.KB_FILE_UPLOAD.type) return <FileText className="h-4 w-4" />;
  if (type === KB_SETTINGS.KB_FAQ.type) return <HelpCircle className="h-4 w-4" />;
  if (type === KB_SETTINGS.KB_WEB_SCRAPER.type) return <Globe className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

const getTypeColor = (type: number) => {
  if (type === KB_SETTINGS.KB_CONVERSATION.type) return 'bg-primary/10 text-primary border border-primary/20';
  if (type === KB_SETTINGS.KB_FILE_UPLOAD.type) return 'bg-accent/10 text-accent-foreground border border-accent/20';
  if (type === KB_SETTINGS.KB_FAQ.type) return 'bg-secondary/10 text-secondary border border-secondary/20';
  if (type === KB_SETTINGS.KB_WEB_SCRAPER.type) return 'bg-primary/10 text-primary border border-primary/20';
  return 'bg-muted text-muted-foreground border border-border';
};

const getTypeName = (type: number) => {
  if (type === KB_SETTINGS.KB_CONVERSATION.type) return 'Conversation';
  if (type === KB_SETTINGS.KB_FILE_UPLOAD.type) return 'Files';
  if (type === KB_SETTINGS.KB_FAQ.type) return 'FAQ';
  if (type === KB_SETTINGS.KB_WEB_SCRAPER.type) return 'Website';
  return 'Unknown';
};

export default function KnowledgeBasePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
  const [formData, setFormData] = useState<CreateKnowledgeBaseForm>({
    name: '',
    summary: '',
    type: 'file',
    files: [],
    faqs: [],
    url: ''
  });

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/knowledgebase');
      const data: KnowledgeBasesResponse = await response.json();
      
      if (data.success && data.data) {
        // Ensure knowledgeBases is always an array
        const kbData = Array.isArray(data.data) ? data.data : [];
        setKnowledgeBases(kbData);
      } else {
        toast.error('Failed to load knowledge bases');
      }
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
      toast.error('Failed to load knowledge bases');
    } finally {
      setLoading(false);
    }
  };

  // Categorize and filter knowledge bases
  const categorizedKBs = useMemo(() => {
    const filtered = knowledgeBases.filter(kb => {
      // 🚫 ALWAYS EXCLUDE CONVERSATIONS from all views except the dedicated conversation tab
      if (kb.type === KB_SETTINGS.KB_CONVERSATION.type && activeCategory !== 'conversation') {
        return false;
      }

      const matchesSearch = !searchQuery || 
        kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kb.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTypeName(kb.type).toLowerCase().includes(searchQuery.toLowerCase());
      
      // Use the helper function for category filtering
      const categoryType = getCategoryTypeFilter(activeCategory as CategoryFilter);
      const matchesCategory = categoryType === undefined || kb.type === categoryType;
      
      return matchesSearch && matchesCategory;
    });

    // Sort results
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'type_asc':
          return a.type - b.type;
        case 'type_desc':
          return b.type - a.type;
        case 'created_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

    // Categorize with conversation exclusion for non-conversation views
    const allNonConversationKBs = knowledgeBases.filter(kb => kb.type !== KB_SETTINGS.KB_CONVERSATION.type);
    const conversationKBs = knowledgeBases.filter(kb => kb.type === KB_SETTINGS.KB_CONVERSATION.type);

    return {
      // 🚫 ALWAYS exclude conversations from "all" - they only appear in conversation tab
      all: sorted.filter(kb => kb.type !== KB_SETTINGS.KB_CONVERSATION.type),
      conversation: conversationKBs.filter(kb => {
        return !searchQuery || 
          kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kb.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getTypeName(kb.type).toLowerCase().includes(searchQuery.toLowerCase());
      }),
      files: sorted.filter(kb => kb.type === KB_SETTINGS.KB_FILE_UPLOAD.type),
      faq: sorted.filter(kb => kb.type === KB_SETTINGS.KB_FAQ.type),
      web: sorted.filter(kb => kb.type === KB_SETTINGS.KB_WEB_SCRAPER.type),
    };
  }, [knowledgeBases, searchQuery, activeCategory, sortBy]);

  const createKnowledgeBase = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    if (formData.type === 'file' && (!formData.files || formData.files.length === 0)) {
      toast.error('Please select at least one file');
      return;
    }

    if (formData.type === 'faq' && (!formData.faqs || formData.faqs.length === 0)) {
      toast.error('Please add at least one FAQ');
      return;
    }

    if (formData.type === 'web' && !formData.url?.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      setIsCreating(true);

      if (formData.type === 'file') {
        // Handle file upload
        for (const file of formData.files!) {
          // Convert file to base64
          const fileContent = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          const base64Content = fileContent.split(',')[1]; // Remove data:mime;base64, prefix

          const uploadResponse = await fetch('/api/ai/knowledgebase/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileContent: base64Content,
              mimeType: file.type,
              size: file.size,
              metadata: {
                knowledge_base_name: formData.name,
                summary: formData.summary
              }
            })
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }
        }

        toast.success(`Successfully uploaded ${formData.files!.length} file(s)`);
      } else if (formData.type === 'faq') {
        // Handle FAQ creation - use helper function for type conversion
        const insertData: KnowledgeBaseInsert = {
          name: formData.name.trim(),
          type: convertFormTypeToDBType(formData.type), // Use helper function
          user_id: 'placeholder', // Will be set by the API
          provider_type: PROVIDER_TYPE.GHL_LOCATION,
          provider_type_sub_id: crypto.randomUUID(),
          summary: formData.summary || undefined,
          data: {
            created_via: 'manual',
            created_at: new Date().toISOString(),
            faq_count: formData.faqs!.length,
            metadata: {
              creation_method: 'manual_faq'
            }
          },
          faq: {
            faqs: formData.faqs!.map((faq, index) => ({
              id: crypto.randomUUID(),
              question: faq.question,
              answer: faq.answer,
              category: 'general',
              created_at: new Date().toISOString(),
              order: index
            }))
          }
        };

        const response = await fetch('/api/ai/knowledgebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(insertData)
        });

        if (!response.ok) {
          throw new Error('Failed to create knowledge base');
        }

        toast.success('FAQ knowledge base created successfully');
      } else if (formData.type === 'web') {
        // Handle web scraping
        const scrapeResponse = await fetch('/api/ai/knowledgebase/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: formData.url!.trim(),
            options: {
              includeImages: false,
              includeLinks: true,
              maxDepth: 1
            },
            metadata: {
              knowledge_base_name: formData.name,
              summary: formData.summary
            }
          })
        });

        if (!scrapeResponse.ok) {
          throw new Error('Failed to scrape website');
        }

        toast.success('Website content scraped successfully');
      }

      // Reset form and close dialog
      setFormData({
        name: '',
        summary: '',
        type: 'file',
        files: [],
        faqs: [],
        url: ''
      });
      setIsDialogOpen(false);
      loadKnowledgeBases();

    } catch (error) {
      console.error('Error creating knowledge base:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create knowledge base');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteKnowledgeBase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ai/knowledgebase/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete knowledge base');
      }

      toast.success('Knowledge base deleted successfully');
      loadKnowledgeBases();
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      toast.error('Failed to delete knowledge base');
    }
  };

  const addFAQ = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: '', answer: '' }]
    }));
  };

  const removeFAQ = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs?.filter((_, i) => i !== index) || []
    }));
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs?.map((faq, i) => 
        i === index ? { ...faq, [field]: value } : faq
      ) || []
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        files: Array.from(e.target.files!)
      }));
    }
  };

  const getCategoryStats = () => {
    const conversationKBs = knowledgeBases.filter(kb => kb.type === KB_SETTINGS.KB_CONVERSATION.type);
    const nonConversationKBs = knowledgeBases.filter(kb => kb.type !== KB_SETTINGS.KB_CONVERSATION.type);
    
    return {
      // 🚫 IMPORTANT: "All" only shows actual knowledge bases, NOT conversations
      // Conversations are auto-generated and should only appear in the conversation tab
      all: nonConversationKBs.length,
      conversation: conversationKBs.length,
      files: knowledgeBases.filter(kb => kb.type === KB_SETTINGS.KB_FILE_UPLOAD.type).length,
      faq: knowledgeBases.filter(kb => kb.type === KB_SETTINGS.KB_FAQ.type).length,
      web: knowledgeBases.filter(kb => kb.type === KB_SETTINGS.KB_WEB_SCRAPER.type).length,
    };
  };

  const stats = getCategoryStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Knowledge Base
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage your AI training data and resources</p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Knowledge Base
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/30 to-purple-50/30 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search knowledge bases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-blue-200 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-blue-200 focus:ring-blue-500 bg-white">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Newest First
                      </div>
                    </SelectItem>
                    <SelectItem value="created_asc">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Oldest First
                      </div>
                    </SelectItem>
                    <SelectItem value="name_asc">
                      <div className="flex items-center gap-2">
                        <SortAsc className="h-4 w-4" />
                        Name A-Z
                      </div>
                    </SelectItem>
                    <SelectItem value="name_desc">
                      <div className="flex items-center gap-2">
                        <SortAsc className="h-4 w-4 rotate-180" />
                        Name Z-A
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Stats Badge */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50 px-3 py-1">
                <Database className="h-3 w-3 mr-1" />
                {stats.all} Knowledge Base{stats.all !== 1 ? 's' : ''}
              </Badge>
              {searchQuery && (
                <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50 px-3 py-1">
                  <Search className="h-3 w-3 mr-1" />
                  Filtered Results
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-1 h-auto">
          <TabsTrigger 
            value="all" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3"
          >
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">All</span> ({stats.all})
          </TabsTrigger>
          <TabsTrigger 
            value="conversation" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span> ({stats.conversation})
          </TabsTrigger>
          <TabsTrigger 
            value="files" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Files</span> ({stats.files})
          </TabsTrigger>
          <TabsTrigger 
            value="faq" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span> ({stats.faq})
          </TabsTrigger>
          <TabsTrigger 
            value="web" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-3"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Web</span> ({stats.web})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <KnowledgeBaseGrid kbs={categorizedKBs.all} onDelete={deleteKnowledgeBase} />
        </TabsContent>
        
        <TabsContent value="conversation" className="mt-6">
          <KnowledgeBaseGrid kbs={categorizedKBs.conversation} onDelete={deleteKnowledgeBase} />
        </TabsContent>
        
        <TabsContent value="files" className="mt-6">
          <KnowledgeBaseGrid kbs={categorizedKBs.files} onDelete={deleteKnowledgeBase} />
        </TabsContent>
        
        <TabsContent value="faq" className="mt-6">
          <KnowledgeBaseGrid kbs={categorizedKBs.faq} onDelete={deleteKnowledgeBase} />
        </TabsContent>
        
        <TabsContent value="web" className="mt-6">
          <KnowledgeBaseGrid kbs={categorizedKBs.web} onDelete={deleteKnowledgeBase} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Knowledge Base Grid Component
function KnowledgeBaseGrid({ kbs, onDelete }: { kbs: KnowledgeBase[], onDelete: (id: string) => void }) {
  const router = useRouter();

  if (kbs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Database className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No knowledge bases found</h3>
        <p className="text-muted-foreground">
          No knowledge bases match your current filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {kbs.map((kb) => (
        <Card key={kb.id} className="group hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {kb.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {getTypeName(kb.type)}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {new Date(kb.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Description */}
            {kb.summary && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {kb.summary}
              </p>
            )}

            {/* Contact info for conversation KBs */}
            {kb.type === KB_SETTINGS.KB_CONVERSATION.type && (kb as any).data?.contact_info && (
              <div className="mb-4 p-3 bg-muted rounded-md">
                <div className="text-sm font-medium text-foreground mb-1">
                  {(kb as any).data.contact_info.name || 'Contact'}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {(kb as any).data.contact_info.email && (
                    <div>{(kb as any).data.contact_info.email}</div>
                  )}
                  {(kb as any).data.contact_info.phone && (
                    <div>{(kb as any).data.contact_info.phone}</div>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="space-y-2 mb-5">
              {(kb as any).data?.conversation_stats?.total_messages && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Messages</span>
                  <span className="font-medium text-foreground">
                    {(kb as any).data.conversation_stats.total_messages}
                  </span>
                </div>
              )}
              {kb.faq && Array.isArray(kb.faq) && kb.faq.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">FAQs</span>
                  <span className="font-medium text-foreground">{kb.faq.length}</span>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => router.push(`/dashboard/app/ai/knowledgebase/${kb.id}`)}
                className="flex-1 px-3 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 hover:text-foreground rounded-md transition-colors"
              >
                View Details
              </button>
              
              <button 
                onClick={() => onDelete(kb.id)}
                className="px-3 py-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
