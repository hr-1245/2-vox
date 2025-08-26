'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Bot, 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  Database, 
  CheckCircle, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  FileText,
  Globe,
  MessageCircle,
  Calendar,
  SortAsc,
  X,
  Settings
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { KnowledgeBase } from '@/utils/database/knowledgebase';
import { KB_SETTINGS } from '@/utils/ai/knowledgebaseSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

// Constants
const USER_ID = 'ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21';

interface CreateAgentForm {
  name: string;
  description: string;
  personality: string;
  intent: string;
  additionalInformation: string;
  variables: Record<string, string>;
  knowledgeBaseIds: string[];
  isActive: boolean;
  // AI Configuration (required by FastAPI)
  temperature: number;
  model: string;
  humanlikeBehavior: boolean;
}

export default function CreateAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [creating, setCreating] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loadingKB, setLoadingKB] = useState(false);
  
  // Detect agent type from URL params (1 = Conversation AI, 5 = Voice AI)
  const agentType = searchParams.get('type') === '5' ? 5 : 1;
  const isVoiceAgent = agentType === 5;
  const agentTypeName = isVoiceAgent ? 'Voice AI Agent' : 'Conversation AI Agent';
  const agentTypeDescription = isVoiceAgent 
    ? 'Create an AI assistant for voice conversations and phone calls'
    : 'Create an intelligent AI assistant for text conversations';
  
  // Knowledge Base filtering state
  const [showConversationKBs, setShowConversationKBs] = useState(false);
  const [kbSearchTerm, setKbSearchTerm] = useState('');
  const [kbTypeFilter, setKbTypeFilter] = useState<number | 'all'>('all');
  const [kbSortBy, setKbSortBy] = useState<'name' | 'created' | 'type'>('name');

  const [formData, setFormData] = useState<CreateAgentForm>({
    name: '',
    description: '',
    personality: '',
    intent: '',
    additionalInformation: '',
    variables: {},
    knowledgeBaseIds: [],
    isActive: true,
    // AI Configuration (required by FastAPI)
    temperature: 0.7,
    model: 'gpt-4',
    humanlikeBehavior: false
  });

  const progress = (currentStep / totalSteps) * 100;

  // Load knowledge bases on component mount
  useEffect(() => {
    const loadKnowledgeBases = async () => {
      try {
        setLoadingKB(true);
        const response = await fetch('/api/ai/knowledgebase');
        const data = await response.json();
        
        if (data.success) {
          const kbData = Array.isArray(data.data) ? data.data : [];
          console.log('Loaded all knowledge bases:', kbData);
          setKnowledgeBases(kbData);
        } else {
          console.error('Failed to load knowledge bases:', data.error);
        }
      } catch (error) {
        console.error('Error loading knowledge bases:', error);
        setKnowledgeBases([]); // Set empty array on error
      } finally {
        setLoadingKB(false);
      }
    };

    loadKnowledgeBases();
  }, []);

  const createAgent = async () => {
    // Prevent multiple submissions
    if (creating) {
      console.log('Agent creation already in progress...');
      return;
    }
    
    try {
      setCreating(true);
      
      // Final validation before submission
      if (!formData.name.trim() || !formData.personality.trim() || !formData.intent.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Convert type number to agentType string as expected by FastAPI
      const getAgentTypeString = (type: number): string => {
  switch (type) {
          case 1: return 'generic'; // AI Agent (GENERIC)
          default: return 'generic';
        }
      };

      const payload = {
        userId: USER_ID,
        name: formData.name,
        description: formData.description,
        agentType: getAgentTypeString(agentType), // Use detected type from URL params
        type: agentType, // Pass the numeric type (1 or 5)
        personality: formData.personality,
        intent: formData.intent,
        additionalInformation: formData.additionalInformation || null,
        variables: Object.keys(formData.variables).length > 0 ? formData.variables : null,
        knowledgeBaseIds: formData.knowledgeBaseIds.length > 0 ? formData.knowledgeBaseIds : null,
        // AI Configuration (required by FastAPI)
        temperature: formData.temperature,
        model: formData.model,
        humanlikeBehavior: formData.humanlikeBehavior
      };

      console.log('Creating agent with payload:', payload);

      const response = await fetch('/api/ai/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Agent creation response:', data);
      
      if (data.success) {
        toast.success('🎉 AI Agent created successfully! Redirecting...');
        
        // Use window.location to ensure proper redirect and prevent route conflicts
        setTimeout(() => {
          window.location.href = '/dashboard/app/ai/agents';
        }, 1500);
      } else {
        toast.error('Failed to create agent: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent. Please check your connection and try again.');
    } finally {
      setCreating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Basic info validation
        return formData.name.trim().length >= 2;
      case 2:
        // Configuration validation
        return formData.name.trim().length >= 2 && 
               formData.personality.trim().length >= 10 && 
               formData.intent.trim().length >= 10;
      case 3:
        return true; // Knowledge base selection is optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps && canProceed()) {
      console.log('Moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      console.log('Moving back to step:', currentStep - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">🎯 Basic Information</h2>
              <p className="text-muted-foreground">
                Set up the basic details for your AI agent.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Agent Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/50 characters
                </p>
              </div>

              {/* Agent Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this agent does..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/200 characters
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">⚙️ Configure Your Agent</h2>
              <p className="text-muted-foreground">
                Define your agent's personality, goals, and behavior.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Main Configuration */}
              <div className="space-y-4">
                {/* Personality */}
                <div className="space-y-2">
                  <Label htmlFor="personality">Personality & Role *</Label>
                  <Textarea
                    id="personality"
                    placeholder="Example: You are a friendly customer support agent for {{business_name}}. You help customers with their questions and maintain a professional yet warm tone."
                    value={formData.personality}
                    onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.personality.length}/500 characters • Use {"{{"} variable {"}"} for dynamic content
                  </p>
                </div>

                {/* Primary Goal */}
                <div className="space-y-2">
                  <Label htmlFor="intent">Primary Goal *</Label>
                  <Textarea
                    id="intent"
                    placeholder="Example: Your goal is to assist customers by answering their questions, resolving issues, and providing helpful information about our products and services."
                    value={formData.intent}
                    onChange={(e) => setFormData(prev => ({ ...prev, intent: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.intent.length}/300 characters
                  </p>
                </div>

                {/* Additional Information */}
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Guidelines (Optional)</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Example: Keep responses between 20-50 words. Always ask follow-up questions. If you don't know something, direct customers to our support team."
                    value={formData.additionalInformation}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalInformation: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional rules, tone guidelines, or specific instructions
                  </p>
                </div>

                {/* Variables */}
                <div className="space-y-2">
                  <Label>Variables (Optional)</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Variable name: value (e.g., business_name: Acme Corp)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const [name, value] = input.value.split(':').map(s => s.trim());
                          if (name && value) {
                            setFormData(prev => ({
                              ...prev,
                              variables: { ...prev.variables, [name]: value }
                            }));
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Press Enter to add. Format: variable_name: value
                    </p>
                    
                    {Object.entries(formData.variables).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(formData.variables).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {`{{${key}}}`}: {value}
                            <button
                              onClick={() => {
                                const newVars = { ...formData.variables };
                                delete newVars[key];
                                setFormData(prev => ({ ...prev, variables: newVars }));
                              }}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* AI Configuration */}
              <Card className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    AI Configuration
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Configure how your AI agent responds and behaves
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Model Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="model">AI Model</Label>
                      <Select
                        value={formData.model}
                        onValueChange={(value) => setFormData({...formData, model: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4 (Best Quality)</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Efficient)</SelectItem>
                          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Creativity Level</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[formData.temperature]}
                          onValueChange={(value) => setFormData({...formData, temperature: value[0]})}
                          max={1}
                          min={0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Consistent</span>
                          <span className="font-medium text-blue-600">{formData.temperature}</span>
                          <span>Creative</span>
                        </div>
                      </div>
                    </div>

                    {/* Human-like Behavior */}
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label htmlFor="humanlikeBehavior">Response Style</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="humanlikeBehavior"
                          checked={formData.humanlikeBehavior}
                          onCheckedChange={(checked) => setFormData({...formData, humanlikeBehavior: checked})}
                        />
                        <Label htmlFor="humanlikeBehavior" className="text-sm">
                          {formData.humanlikeBehavior ? 'Natural & Human-like' : 'Direct & Professional'}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formData.humanlikeBehavior 
                          ? 'Responses will include natural variations and human-like expressions' 
                          : 'Responses will be direct and to-the-point'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        const filteredKBs = getFilteredKnowledgeBases();
        const kbTypes = [...new Set(knowledgeBases.map(kb => kb.type))];
        
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold flex items-center justify-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                Knowledge Sources
              </h2>
              <p className="text-xs text-muted-foreground">
                Connect your agent to knowledge bases for enhanced, contextual responses. This step is optional.
              </p>
            </div>
        
            {/* Conversation KB Toggle */}
            <Card className="border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                      <h4 className="text-xs font-medium text-blue-900">Include Conversation Knowledge</h4>
                    </div>
                    <p className="text-[0.65rem] text-blue-700 mt-0.5">
                      Auto-generated knowledge from past conversations
                    </p>
                  </div>
                  <Switch
                    checked={showConversationKBs}
                    onCheckedChange={setShowConversationKBs}
                    className="scale-90"
                  />
                </div>
              </CardContent>
            </Card>
        
            {/* Search and Filters */}
            <Card className="border">
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Search & Filter Knowledge Sources
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => window.open('/dashboard/app/ai/knowledgebase', '_blank')}
                  >
                    <Plus className="w-2.5 h-2.5 mr-1" />
                    Create New
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs">
                  Find and select knowledge sources, or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                {/* Simple Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <Input
                    placeholder="Search knowledge sources..."
                    value={kbSearchTerm}
                    onChange={(e) => setKbSearchTerm(e.target.value)}
                    className="pl-8 pr-8 h-8 text-sm"
                  />
                  {kbSearchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                      onClick={() => setKbSearchTerm('')}
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  )}
                </div>
        
                {/* Simple Filters Row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Type Filter */}
                  <div className="flex-1">
                    <Select value={kbTypeFilter.toString()} onValueChange={(value) => setKbTypeFilter(value === 'all' ? 'all' : parseInt(value))}>
                      <SelectTrigger className="h-8 text-xs">
                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {kbTypes.map(type => {
                          const typeInfo = getKBTypeInfo(type);
                          return (
                            <SelectItem key={type} value={type.toString()}>
                              {typeInfo.label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
        
                  {/* Sort Filter */}
                  <div className="flex-1">
                    <Select value={kbSortBy} onValueChange={(value: any) => setKbSortBy(value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SortAsc className="w-3.5 h-3.5 mr-1.5" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Sort by Name</SelectItem>
                        <SelectItem value="created">Sort by Created</SelectItem>
                        <SelectItem value="type">Sort by Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
        
                  {/* Selection Summary */}
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {formData.knowledgeBaseIds.length} Selected
                    </Badge>
                    {formData.knowledgeBaseIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setFormData(prev => ({ ...prev, knowledgeBaseIds: [] }))}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
        
                {/* Active Filters */}
                {(kbSearchTerm || kbTypeFilter !== 'all') && (
                  <div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-50 rounded border">
                    <span className="text-[0.65rem] font-medium">Active Filters:</span>
                    {kbSearchTerm && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        Search: "{kbSearchTerm}"
                        <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setKbSearchTerm('')} />
                      </Badge>
                    )}
                    {kbTypeFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        Type: {getKBTypeInfo(kbTypeFilter as number).label}
                        <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setKbTypeFilter('all')} />
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
        
            {/* Knowledge Base List */}
            {filteredKBs.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Showing {filteredKBs.length} of {knowledgeBases.length} knowledge sources
                </div>
                
                <div className="grid gap-2 max-h-80 overflow-y-auto bg-gray-50/50 rounded-lg p-3 border">
                  {filteredKBs.map(kb => {
                    const typeInfo = getKBTypeInfo(kb.type);
                    const isSelected = formData.knowledgeBaseIds.includes(kb.id);
                    
                    return (
                      <Card 
                        key={kb.id} 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          isSelected 
                            ? 'border-2 border-blue-500 bg-blue-50/80' 
                            : 'hover:border-blue-300'
                        }`}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            knowledgeBaseIds: prev.knowledgeBaseIds.includes(kb.id)
                              ? prev.knowledgeBaseIds.filter(id => id !== kb.id)
                              : [...prev.knowledgeBaseIds, kb.id]
                          }));
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id={`kb-${kb.id}`}
                              checked={isSelected}
                              className="mt-0.5 scale-90"
                              onCheckedChange={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  knowledgeBaseIds: prev.knowledgeBaseIds.includes(kb.id)
                                    ? prev.knowledgeBaseIds.filter(id => id !== kb.id)
                                    : [...prev.knowledgeBaseIds, kb.id]
                                }));
                              }}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-gray-900 truncate">{kb.name}</h4>
                                  {kb.summary && (
                                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                                      {kb.summary}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[0.65rem] ${typeInfo.color} border-current px-1.5 py-0.5`}
                                  >
                                    <typeInfo.icon className="w-2.5 h-2.5 mr-0.5" />
                                    {typeInfo.label}
                                  </Badge>
                                  {isSelected && (
                                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1 text-[0.65rem] text-gray-500">
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {new Date(kb.created_at).toLocaleDateString()}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{typeInfo.description}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                  <Database className="w-3.5 h-3.5" />
                  <span>💡 Selected knowledge sources will enhance your agent's responses.</span>
                </div>
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-gray-50">
                <CardContent className="p-4 text-center">
                  <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="font-medium text-sm text-gray-900 mb-1">
                    {kbSearchTerm || kbTypeFilter !== 'all' 
                      ? 'No matching knowledge sources found' 
                      : 'No knowledge sources available'}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {kbSearchTerm || kbTypeFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Create knowledge sources to enhance your AI agent.'}
                  </p>
                  
                  <div className="flex gap-2 justify-center flex-wrap">
                    {(kbSearchTerm || kbTypeFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setKbSearchTerm('');
                          setKbTypeFilter('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                    
                    {!showConversationKBs && !(kbSearchTerm || kbTypeFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setShowConversationKBs(true)}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Show Conversations
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => window.open('/dashboard/app/ai/knowledgebase', '_blank')}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Knowledge Base
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canProceed()) {
      console.log('Moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      console.log('Moving back to step:', currentStep - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length >= 2;
      case 2:
        return formData.name.trim().length >= 2 && 
               formData.personality.trim().length >= 10 && 
               formData.intent.trim().length >= 10;
      case 3:
        return true; // Knowledge base selection is optional
      default:
        return false;
    }
  };

  const getKBTypeInfo = (type: number) => {
    const types = {
      1: { label: 'Conversation', icon: MessageCircle, color: 'text-blue-600 bg-blue-100 border-blue-200', description: 'Auto-generated from conversations' },
      2: { label: 'File Upload', icon: FileText, color: 'text-green-600 bg-green-100 border-green-200', description: 'Uploaded documents and files' },
      3: { label: 'FAQ', icon: MessageSquare, color: 'text-purple-600 bg-purple-100 border-purple-200', description: 'Frequently asked questions' },
      4: { label: 'Web Scraper', icon: Globe, color: 'text-orange-600 bg-orange-100 border-orange-200', description: 'Content from websites' }
    };
    return types[type as keyof typeof types] || { label: 'Unknown', icon: Database, color: 'text-gray-600 bg-gray-100 border-gray-200', description: 'Unknown type' };
  };

  const getFilteredKnowledgeBases = () => {
    let filtered = showConversationKBs 
      ? knowledgeBases 
      : knowledgeBases.filter(kb => kb.type !== KB_SETTINGS.KB_CONVERSATION.type);

    // Apply search filter
    if (kbSearchTerm) {
      filtered = filtered.filter(kb => 
        kb.name.toLowerCase().includes(kbSearchTerm.toLowerCase()) ||
        kb.summary?.toLowerCase().includes(kbSearchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (kbTypeFilter !== 'all') {
      filtered = filtered.filter(kb => kb.type === kbTypeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (kbSortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'type':
          return a.type - b.type;
        default:
          return 0;
      }
    });

    return filtered;
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {/* Main Wizard Card */}
        <Card className="border shadow-sm">
          <CardContent className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <a href="/dashboard/app/ai/agents" className="hover:text-foreground transition-colors">
                  AI Agents
                </a>
                <span>/</span>
                <span className="text-foreground font-medium">Create New Agent</span>
              </div>
              
              {/* Clean Page Header */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {agentTypeName} Wizard
                  </h1>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    {agentTypeDescription}
                  </p>
                </div>
              </div>

              {/* Clean Progress Section */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
                  <Badge variant="outline">
                    {agentTypeName}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <Progress value={progress} className="h-2" />
                  
                  {/* Simple Step Navigation */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { step: 1, title: "Basic Info", icon: Bot },
                      { step: 2, title: "Configure", icon: Settings },
                      { step: 3, title: "Knowledge", icon: Database }
                    ].map((stepInfo) => (
                      <div 
                        key={stepInfo.step}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          currentStep === stepInfo.step
                            ? 'bg-primary text-primary-foreground border-primary'
                            : currentStep > stepInfo.step
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <stepInfo.icon className={`h-4 w-4 mx-auto mb-1 ${
                          currentStep === stepInfo.step ? 'text-primary-foreground' 
                          : currentStep > stepInfo.step ? 'text-green-600'
                          : 'text-gray-500'
                        }`} />
                        <div className="text-sm font-medium">{stepInfo.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <Card className="mb-8 border">
              <CardContent className="p-8">
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                {currentStep === totalSteps ? (
                  <Button
                    type="button"
                    onClick={createAgent}
                    disabled={creating || !isStepValid()}
                  >
                    {creating ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                        Creating Agent...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        Create AI Agent
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 