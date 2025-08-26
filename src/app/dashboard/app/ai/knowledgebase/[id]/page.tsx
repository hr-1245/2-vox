'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Database, 
  Edit, 
  Save, 
  Trash2, 
  AlertCircle, 
  FileText,
  Globe,
  HelpCircle,
  RefreshCw,
  Calendar,
  Settings
} from 'lucide-react';

interface KnowledgeBase {
  id: string;
  name: string;
  type: number;
  summary?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  data?: any;
  faq?: any;
  file_uploads?: string;
}

interface EditForm {
  name: string;
  summary: string;
  data?: any;
}

export default function KnowledgeBaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kbId = params.id as string;

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    summary: ''
  });

  useEffect(() => {
    loadKnowledgeBase();
  }, [kbId]);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/knowledgebase/${kbId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setKb(data.data);
        setEditForm({
          name: data.data.name,
          summary: data.data.summary || ''
        });
      } else {
        throw new Error(data.error || 'Failed to load knowledge base');
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      setError(error instanceof Error ? error.message : 'Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/ai/knowledgebase/${kbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setKb(data.data);
        setIsEditing(false);
        toast.success('Knowledge base updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update knowledge base');
      }
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update knowledge base');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this knowledge base? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      
      const response = await fetch(`/api/ai/knowledgebase/${kbId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Knowledge base deleted successfully');
        router.push('/dashboard/app/ai/knowledgebase');
      } else {
        throw new Error(data.error || 'Failed to delete knowledge base');
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete knowledge base');
    } finally {
      setDeleting(false);
    }
  };

  const getKBTypeName = (type: number): string => {
    switch (type) {
      case 1: return 'Conversation';
      case 2: return 'File Upload';
      case 3: return 'FAQ';
      case 4: return 'Web Scraper';
      default: return 'Unknown';
    }
  };

  const getKBTypeIcon = (type: number) => {
    switch (type) {
      case 1: return <Database className="h-5 w-5" />;
      case 2: return <FileText className="h-5 w-5" />;
      case 3: return <HelpCircle className="h-5 w-5" />;
      case 4: return <Globe className="h-5 w-5" />;
      default: return <Database className="h-5 w-5" />;
    }
  };

  const getKBTypeColor = (type: number) => {
    switch (type) {
      case 1: return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 2: return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 3: return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 4: return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <LoadingSpinner className="h-6 w-6" />
          <span>Loading knowledge base...</span>
        </div>
      </div>
    );
  }

  if (error || !kb) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Knowledge Base</AlertTitle>
          <AlertDescription className="mt-2">
            {error || 'Knowledge base not found'}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadKnowledgeBase}
              className="ml-2 h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getKBTypeColor(kb.type)}`}>
              {getKBTypeIcon(kb.type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{kb.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {getKBTypeName(kb.type)}
                </Badge>
                <span>•</span>
                <span>Created {new Date(kb.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Information</CardTitle>
              <CardDescription>
                Basic information and metadata about this knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Knowledge base name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Summary</label>
                    <Textarea
                      value={editForm.summary}
                      onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Describe what this knowledge base contains..."
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <div className="flex items-center gap-2 mt-1">
                        {getKBTypeIcon(kb.type)}
                        <span>{getKBTypeName(kb.type)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(kb.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {kb.summary && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Summary</label>
                      <p className="mt-1 text-sm leading-relaxed">{kb.summary}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>
                Usage and performance metrics for this knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">--</div>
                  <div className="text-sm text-muted-foreground">Queries</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">--</div>
                  <div className="text-sm text-muted-foreground">Documents</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">--</div>
                  <div className="text-sm text-muted-foreground">Vectors</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">--</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                View and manage the content in this knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Content management features will be available soon</p>
                <p className="text-sm mt-2">You'll be able to view, edit, and manage knowledge base content here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced options for this knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced settings will be available soon</p>
                <p className="text-sm mt-2">You'll be able to configure indexing, training, and other advanced options here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
