'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ConversationsList } from "./ConversationsList";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Search, ChevronDown, MessageSquare } from "lucide-react";
import { useConversations, type Conversation } from "./hooks/useConversations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConversationsPageProps {
  locationId?: string;
}

export function ConversationsPage({ locationId }: ConversationsPageProps = {}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters] = useState({ limit: 20 }); // Reduced initial limit for better UX

  const {
    conversations,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    fetchConversations,
    loadMore,
    refresh
  } = useConversations({ 
    initialFilters: filters,
    locationId: locationId 
  });

  // Auto-load conversations on mount
  useEffect(() => {
    if (!isLoading && conversations.length === 0 && !error) {
      console.log('Auto-loading conversations...');
      fetchConversations(filters);
    }
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
    fetchConversations({
      ...filters,
        query: searchQuery.trim()
    });
    } else {
      // If search is empty, just refresh
      refresh();
    }
  };

  const handleRefresh = () => {
    setSearchQuery(''); // Clear search on refresh
    refresh();
  };

  const handleConversationClick = (conversation: Conversation) => {
    const params = new URLSearchParams({
      contact: conversation.contactName || conversation.fullName || '',
      ...(conversation.email && { email: conversation.email }),
      ...(conversation.phone && { phone: conversation.phone })
    });
    
    // Open conversation in a new tab
    const url = `/dashboard/app/leadconnector/conversations/${conversation.id}?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLoadMore = () => {
    loadMore();
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Conversations
              </h1>
              {total > 0 && (
                <p className="text-sm text-muted-foreground">
                  {conversations.length} of {total.toLocaleString()} conversations
                </p>
              )}
            </div>
          </div>
          
          {isLoading && (
            <div className="flex items-center text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Failed to load conversations</p>
              <p className="text-sm">{error}</p>
              {error.includes('connect') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/app/leadconnector')}
                >
                  Go to Lead Connector Settings
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
            placeholder="Search conversations by contact name, email, or message content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
        />
        </div>
        <Button onClick={handleSearch} disabled={isLoading} className="w-full sm:w-auto">
          <Search className="w-4 h-4 mr-2 sm:mr-1" />
          <span className="sm:hidden">Search Conversations</span>
          <span className="hidden sm:inline">Search</span>
        </Button>
        {searchQuery && (
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              refresh();
            }}
            disabled={isLoading}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Loading State - Initial Load */}
      {isLoading && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner className="mb-4" />
          <p className="text-muted-foreground">Loading conversations...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a few seconds</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && conversations.length === 0 && !error && (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 
                'Try adjusting your search terms or clear the search to see all conversations.' :
                'No conversations available at the moment.'
              }
            </p>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
          >
              <RefreshCw className="w-4 h-4" />
          </Button>
          </CardContent>
        </Card>
      )}

      {/* Conversations List */}
      {conversations.length > 0 && (
        <div className="space-y-6">
        <ConversationsList 
          conversations={conversations} 
          isLoading={isLoading}
          onConversationClick={handleConversationClick}
        />
          
          {/* Load More Section */}
          {hasMore && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Showing {conversations.length} of {total.toLocaleString()} conversations
                </p>
                <div className="w-full max-w-md bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((conversations.length / total) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleLoadMore}
                disabled={isLoadingMore || isLoading}
                variant="outline"
                size="lg"
                className="min-w-48"
              >
                {isLoadingMore ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* End of Results */}
          {!hasMore && conversations.length > 0 && (
            <div className="text-center py-6">
              <Badge variant="outline" className="text-muted-foreground">
                All {total.toLocaleString()} conversations loaded
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
