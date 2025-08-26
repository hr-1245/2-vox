'use client';

import { useState, useCallback, useRef } from 'react';
import { Conversation } from '@/lib/leadconnector/types/conversationTypes';
import { autoEnableVoxAiAutopilot } from '@/utils/autopilot/voxAiAutoEnable';

// Re-export the Conversation type for convenience
export type { Conversation };

interface UseConversationsOptions {
  initialFilters?: {
    limit?: number;
    query?: string;
  };
  locationId?: string;
}

interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  fetchConversations: (filters?: { limit?: number; query?: string; cursor?: string }, append?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface ApiResponse {
  success: boolean;
  data?: {
    conversations: Conversation[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
  error?: string;
}

// In-memory cache for request deduplication
const requestCache = new Map<string, Promise<ApiResponse>>();
const CACHE_DURATION = 10000; // 10 seconds

const clearOldRequests = () => {
  // Clear old requests from cache periodically
  setTimeout(() => {
    requestCache.clear();
  }, CACHE_DURATION);
};

const getErrorMessage = (error: any, status?: number): string => {
  if (typeof error === 'string') return error;
  
  // Handle specific error cases
  if (status === 401) return 'Authentication expired. Please refresh the page.';
  if (status === 400) return 'Invalid request. Please check your settings.';
  if (status === 403) return 'Access denied. Please check your permissions.';
  if (status === 429) return 'Too many requests. Please wait a moment.';
  if (status === 500) return 'Server error. Please try again later.';

  // Try to extract message from error object
  let message = '';
  if (error?.message) message = error.message;
  else if (error?.error) message = error.error;
  else if (error?.detail) message = error.detail;
  
  return message || 'Failed to load conversations';
};

export function useConversations(
  options: UseConversationsOptions = {}
): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [lastFilters, setLastFilters] = useState<{ limit?: number; query?: string }>({});

  // Extract locationId from options for vox-ai auto-enable
  const { locationId } = options;
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchConversations = useCallback(async (
    filters: { limit?: number; query?: string; cursor?: string } = {},
    append: boolean = false
  ) => {
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      const isLoadMore = append && filters.cursor;
      
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
      setIsLoading(true);
        setError(null);
        setLastFilters(filters);
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.limit) queryParams.set('limit', filters.limit.toString());
      if (filters.query) queryParams.set('query', filters.query);
      if (filters.cursor) queryParams.set('startAfterDate', filters.cursor);

      const requestKey = queryParams.toString();
      
      // Check if we already have this request in flight
      let requestPromise = requestCache.get(requestKey);
      
      if (!requestPromise) {
        console.log(`🔄 Fetching conversations${isLoadMore ? ' (load more)' : ''}`);

        // Create new request
        requestPromise = fetch(
        `/api/leadconnector/conversations/search?${queryParams.toString()}`,
        {
            signal: abortControllerRef.current.signal,
            headers: {
              'Cache-Control': 'no-cache', // Bypass browser cache but use server cache
            }
        }
        ).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
            throw new Error(getErrorMessage(errorData.error || errorData.message, response.status));
          }
          return response.json();
        });
        
        // Cache the request
        requestCache.set(requestKey, requestPromise);
        
        // Clear old requests after delay
        clearOldRequests();
      } else {
        console.log('📋 Using cached request for:', requestKey);
      }

      const data: ApiResponse = await requestPromise;

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch conversations');
      }

      const newConversations = data.data?.conversations || [];
      
      if (isLoadMore) {
        // Append new conversations
        setConversations(prev => [...prev, ...newConversations]);
      } else {
        // Replace conversations
        setConversations(newConversations);
      }
      
      setHasMore(data.data?.hasMore || false);
      setTotal(data.data?.total || 0);
      setNextCursor(data.data?.nextCursor);
      setError(null);
      
      console.log(`✅ Loaded ${newConversations.length} conversations${isLoadMore ? ' (appended)' : ''}. Total: ${data.data?.total || 0}`);

      // 🤖 CRITICAL VOX-AI FEATURE: Auto-enable autopilot for vox-ai tagged conversations
      if (locationId && newConversations.length > 0) {
        try {
          await autoEnableVoxAiAutopilot(newConversations, locationId);
    } catch (error) {
          console.error('⚠️ Non-critical error auto-enabling vox-ai autopilot:', error);
          // Don't throw - this is non-critical for conversation loading
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 Request was cancelled');
        return;
      }
      
      console.error('❌ Error fetching conversations:', error);
      setError(error.message || 'Failed to load conversations');
      
      if (!append) {
        setConversations([]);
        setHasMore(false);
        setTotal(0);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore || isLoading) {
      return;
    }
    
    await fetchConversations({
      ...lastFilters,
      cursor: nextCursor
    }, true);
  }, [hasMore, nextCursor, isLoadingMore, isLoading, lastFilters, fetchConversations]);

  const refresh = useCallback(async () => {
    setNextCursor(undefined);
    await fetchConversations(lastFilters, false);
  }, [lastFilters, fetchConversations]);

  return {
    conversations,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    fetchConversations,
    loadMore,
    refresh
  };
}
