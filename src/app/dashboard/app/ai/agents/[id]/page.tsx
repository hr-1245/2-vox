'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Bot, Edit, Save, ArrowLeft, TestTube, Activity, Calendar, User, MessageSquare, Settings, Trash2 } from 'lucide-react';

interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  agentType: string;
  personality: string;
  intent: string;
  additionalInformation: string;
  systemPrompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Remove hardcoded user ID for production readiness
// const USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

const AGENT_TYPES = {
  query: { label: 'Query Agent', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  suggestions: { label: 'Suggestions Agent', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  response: { label: 'Response Agent', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' }
};

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <AgentDetailClientPage params={params} />;
}

function AgentDetailClientPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentId, setAgentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    personality: '',
    intent: '',
    additionalInformation: '',
    isActive: true
  });
  
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  // Helper function to convert agent type number to string
  const getAgentTypeString = (type: number): string => {
    switch (type) {
      case 1: return 'query';
      case 2: return 'suggestions';
      case 3: return 'response';
      default: return 'query';
    }
  };

  useEffect(() => {
    // Resolve params promise
    params.then(resolvedParams => {
      setAgentId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
  }, [agentId]);

  useEffect(() => {
    if (agent) {
      setEditForm({
        name: agent.name,
        description: agent.description,
        personality: agent.personality,
        intent: agent.intent,
        additionalInformation: agent.additionalInformation,
        isActive: agent.isActive
      });
    }
  }, [agent]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/agents/${agentId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform database format to expected format
        const agent = data.data;
        const agentData = agent.data || {}; // Extract the data field containing personality, intent, etc.
        
        const transformedAgent = {
          id: agent.id,
          userId: agent.user_id,
          name: agent.name,
          description: agent.description || '',
          agentType: getAgentTypeString(agent.type),
          personality: agentData.personality || '',
          intent: agentData.intent || '',
          additionalInformation: agentData.additionalInformation || '',
          systemPrompt: agent.system_prompt || '',
          isActive: agent.is_active !== false,
          createdAt: agent.created_at,
          updatedAt: agent.updated_at || agent.created_at
        };
        setAgent(transformedAgent);
      } else {
        throw new Error(data.error || 'Failed to load agent');
      }
    } catch (error) {
      console.error('Error loading agent:', error);
      toast.error('Failed to load agent');
      router.push('/dashboard/app/ai/agents');
    } finally {
      setLoading(false);
    }
  };

  const saveAgent = async () => {
    if (!editForm.name.trim() || !editForm.personality.trim() || !editForm.intent.trim()) {
      toast.error('Name, personality, and intent are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/ai/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          data: {
            personality: editForm.personality,
            intent: editForm.intent,
            additionalInformation: editForm.additionalInformation
          },
          is_active: editForm.isActive
        })
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform the updated agent data
        const agent = data.data;
        const agentData = agent.data || {};
        
        const transformedAgent = {
          id: agent.id,
          userId: agent.user_id,
          name: agent.name,
          description: agent.description || '',
          agentType: getAgentTypeString(agent.type),
          personality: agentData.personality || '',
          intent: agentData.intent || '',
          additionalInformation: agentData.additionalInformation || '',
          systemPrompt: agent.system_prompt || '',
          isActive: agent.is_active !== false,
          createdAt: agent.created_at,
          updatedAt: agent.updated_at || agent.created_at
        };
        setAgent(transformedAgent);
        setEditing(false);
        toast.success('Agent updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    } finally {
      setSaving(false);
    }
  };

  const testAgent = async () => {
    if (!testInput.trim()) {
      toast.error('Please enter test input');
      return;
    }

    try {
      setTesting(true);
      // Use the agent conversation API for testing
      const response = await fetch('/api/ai/agents/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentId,
          conversationId: 'test-conversation',
          query: testInput,
          mode: 'query',
          context: 'Testing agent functionality'
        })
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setTestResult(data.data.answer || data.data.response || 'Agent responded successfully');
      toast.success('Agent test completed');
      } else {
        // Fallback for when testing backend is not available
        setTestResult(`Demo response: I received your test message "${testInput}". This agent (${agent?.name}) would process this through the AI system when fully connected.`);
        toast.warning('AI backend unavailable - showing demo response');
      }
    } catch (error) {
      console.error('Error testing agent:', error);
      // Provide a fallback response
      setTestResult(`Demo response: I received your test message "${testInput}". This agent (${agent?.name}) would process this through the AI system when fully connected.`);
      toast.warning('AI backend unavailable - showing demo response');
    } finally {
      setTesting(false);
    }
  };

  const deleteAgent = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/ai/agents/${agentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Agent deleted successfully');
        router.push('/dashboard/app/ai/agents');
      } else {
        throw new Error(data.error || 'Failed to delete agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    if (agent) {
      setEditForm({
        name: agent.name,
        description: agent.description,
        personality: '', // Placeholder, will be updated
        intent: '', // Placeholder, will be updated
        additionalInformation: '', // Placeholder, will be updated
        isActive: agent.isActive
      });
    }
    setEditing(false);
  };

  const getAgentTypeInfo = (type: string) => {
    return AGENT_TYPES[type as keyof typeof AGENT_TYPES] || AGENT_TYPES.query;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-8">
        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Agent not found</h3>
        <p className="text-muted-foreground mb-4">
          The requested agent could not be found.
        </p>
        <Button onClick={() => router.push('/dashboard/app/ai/agents')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </div>
    );
  }

  const typeInfo = getAgentTypeInfo(agent.agentType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/app/ai/agents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">
              {agent.description || 'No description provided'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{agent.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAgent}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={saveAgent} disabled={saving}>
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
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Agent Configuration
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge className={typeInfo.color}>
                    {typeInfo.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Agent Name</Label>
                  {editing ? (
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter agent name..."
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">
                      {agent.name}
                    </div>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  {editing ? (
                    <Input
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the agent's purpose..."
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">
                      {agent.description || 'No description provided'}
                    </div>
                  )}
                </div>
                
                <div className="grid gap-4">
                  {/* Personality Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="personality">AI Personality & Role</Label>
                    {editing ? (
                      <Textarea
                        id="personality"
                        value={editForm.personality}
                        onChange={(e) => setEditForm(prev => ({ ...prev, personality: e.target.value }))}
                        placeholder="Define the AI's personality and role..."
                        rows={3}
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm">{agent.personality || 'No personality defined'}</p>
                      </div>
                    )}
                  </div>

                  {/* Intent Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="intent">Primary Goal & Intent</Label>
                    {editing ? (
                      <Textarea
                        id="intent"
                        value={editForm.intent}
                        onChange={(e) => setEditForm(prev => ({ ...prev, intent: e.target.value }))}
                        placeholder="Define the primary goal and intent..."
                        rows={3}
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm">{agent.intent || 'No intent defined'}</p>
                      </div>
                    )}
                  </div>

                  {/* Additional Information Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="additionalInformation">Additional Guidelines</Label>
                    {editing ? (
                      <Textarea
                        id="additionalInformation"
                        value={editForm.additionalInformation}
                        onChange={(e) => setEditForm(prev => ({ ...prev, additionalInformation: e.target.value }))}
                        placeholder="Additional guidelines and instructions..."
                        rows={4}
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm">{agent.additionalInformation || 'No additional guidelines'}</p>
                      </div>
                    )}
                  </div>

                  {/* System Prompt Preview (Read-only) */}
                  {!editing && (
                    <div className="grid gap-2">
                      <Label>Generated System Prompt</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {agent.systemPrompt || 'No system prompt generated'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
                
                {editing && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isActive">Agent is active</Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Agent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Agent
              </CardTitle>
              <CardDescription>
                Test your agent with sample input to see how it responds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="test-input">Test Input</Label>
                <Textarea
                  id="test-input"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter your test message or question..."
                  rows={3}
                />
              </div>
              
              <Button onClick={testAgent} disabled={testing || !testInput.trim()}>
                {testing ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Agent
                  </>
                )}
              </Button>
              
              {testResult && (
                <div className="grid gap-2">
                  <Label>Agent Response</Label>
                  <div className="p-4 bg-card border border-border rounded-lg max-h-64 overflow-y-auto shadow-sm">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans bg-transparent border-0 p-0 m-0">{testResult}</pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Agent Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono text-xs">{agent.userId}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Agent ID:</span>
                  <span className="font-mono text-xs">{agent.id}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Type:</span>
                  <Badge className={typeInfo.color} variant="secondary">
                    {typeInfo.label}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(agent.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => setEditing(!editing)}>
                <Edit className="h-4 w-4 mr-2" />
                {editing ? 'Cancel Edit' : 'Edit Agent'}
              </Button>
              
              <Button variant="outline" className="w-full justify-start" onClick={() => {
                setTestInput('Hello, can you help me?');
              }}>
                <TestTube className="h-4 w-4 mr-2" />
                Quick Test
              </Button>
              
              <Button variant="outline" className="w-full justify-start" onClick={() => {
                navigator.clipboard.writeText(agent.id);
                toast.success('Agent ID copied to clipboard');
              }}>
                <Bot className="h-4 w-4 mr-2" />
                Copy Agent ID
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
