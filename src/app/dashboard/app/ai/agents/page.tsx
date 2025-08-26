'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { toast } from 'sonner';
import { 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  ChevronDown,
  Mic,
  Phone
} from 'lucide-react';

interface Agent {
  id: string;
  created_at: string;
  name: string;
  type: number;
  description?: string;
  is_active?: boolean;
  user_id: string;
}

// Agent types for tabs
const AGENT_TYPES = {
  conversation: {
    value: 1,
    label: 'Conversation AI',
    description: 'AI assistant for text conversations and customer support',
    icon: MessageSquare,
    color: 'bg-primary/10 text-primary border-primary/20',
    badge: 'bg-primary'
  },
  voice: {
    value: 5,
    label: 'Voice AI',
    description: 'AI assistant for voice calls and phone interactions',
    icon: Phone,
    color: 'bg-purple-100 text-purple-600 border-purple-200',
    badge: 'bg-purple-600'
  }
};

export default function AIAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'conversation' | 'voice'>('conversation');

  const loadAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/agents');
      const data = await response.json();
      
      if (data.success) {
        const agentsData = data.data?.agents || data.agents || [];
        setAgents(Array.isArray(agentsData) ? agentsData : []);
      } else {
        throw new Error(data.error || 'Failed to load agents');
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Failed to load agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const getAgentTypeInfo = (type: number) => {
    if (type === AGENT_TYPES.conversation.value) {
      return AGENT_TYPES.conversation;
    } else if (type === AGENT_TYPES.voice.value) {
      return AGENT_TYPES.voice;
    }
    return AGENT_TYPES.conversation; // Default to conversation
  };

  const toggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      // If activating an agent, first deactivate all other agents
      if (!currentStatus) {
        const otherActiveAgents = agents.filter(agent => 
          agent.id !== agentId && agent.is_active !== false
        );

        if (otherActiveAgents.length > 0) {
          // Deactivate all other agents first
          const deactivatePromises = otherActiveAgents.map(agent =>
            fetch(`/api/ai/agents/${agent.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_active: false })
            })
          );

          await Promise.all(deactivatePromises);
          toast.info('Deactivated other agents - only one AI agent can be active at a time');
        }
      }

      // Now activate/deactivate the selected agent
      const response = await fetch(`/api/ai/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Agent ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        await loadAgents();
      } else {
        toast.error('Failed to update agent status: ' + data.error);
      }
    } catch (error) {
      console.error('Error toggling agent status:', error);
      toast.error('Failed to update agent status');
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || agent.type === filterType;
    const matchesTab = activeTab === 'conversation' ? agent.type === AGENT_TYPES.conversation.value : agent.type === AGENT_TYPES.voice.value;
    return matchesSearch && matchesType && matchesTab;
  });

  const AgentCard = ({ agent }: { agent: Agent }) => {
    const typeInfo = getAgentTypeInfo(agent.type);
    const TypeIcon = typeInfo.icon;
    const isActive = agent.is_active !== false;

    const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
        return;
      }

      try {
        const response = await fetch(`/api/ai/agents/${agent.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success('Agent deleted successfully!');
          await loadAgents();
        } else {
          toast.error('Failed to delete agent: ' + data.error);
        }
      } catch (error) {
        console.error('Error deleting agent:', error);
        toast.error('Failed to delete agent');
      }
    };

    return (
      <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 ${
        isActive ? 'border-primary/20 bg-primary/5' : 'border-border'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-xl ${typeInfo.color} border transition-all duration-200`}>
              <TypeIcon className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {agent.name}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/app/ai/agents/${agent.id}`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1">
                {agent.description || typeInfo.description}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={`${typeInfo.color} text-xs border-current`}>
                  {typeInfo.label}
                </Badge>
                {isActive && (
                  <Badge className={`${typeInfo.badge} text-white text-xs`}>
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Created {new Date(agent.created_at).toLocaleDateString()}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={() => toggleAgentStatus(agent.id, isActive)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your AI assistants
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push(`/dashboard/app/ai/agents/new?type=${activeTab === 'conversation' ? '1' : '5'}`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create {activeTab === 'conversation' ? 'Conversation' : 'Voice'} AI Agent
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'conversation' | 'voice')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversation" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversation AI
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Voice AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation" className="space-y-6">
          {/* Search and Filter for Conversation AI */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search conversation agents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {filteredAgents.length} conversation agent{filteredAgents.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation AI Agents Grid */}
          <div>
            {filteredAgents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">No conversation agents found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm 
                          ? 'Try adjusting your search'
                          : 'Create your first Conversation AI agent to get started'
                        }
                      </p>
                    </div>
                    
                    {!searchTerm && (
                      <Button 
                        size="lg"
                        onClick={() => router.push('/dashboard/app/ai/agents/new?type=1')}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Conversation AI Agent
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          {/* Voice AI Content - Coming Soon */}
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Phone className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Voice AI Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Voice AI agents for phone calls and voice interactions will be available soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
