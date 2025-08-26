import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { 
  KnowledgeBase, 
  KnowledgeBaseInsert, 
  KnowledgeBasesResponse,
  KnowledgeBaseResponse,
  KnowledgeBaseFilters,
  PaginationParams 
} from '@/utils/database/knowledgebase';

interface ErrorResponse {
  success: false;
  error: string;
}

// GET - List knowledge bases with filtering and pagination
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // Parse filter parameters
    const filters: KnowledgeBaseFilters = {
      type: searchParams.get('type') ? parseInt(searchParams.get('type')!) : undefined,
      provider_type: searchParams.get('provider_type') ? parseInt(searchParams.get('provider_type')!) : undefined,
      search: searchParams.get('search') || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      has_summary: searchParams.get('has_summary') === 'true' ? true : undefined,
      has_faqs: searchParams.get('has_faqs') === 'true' ? true : undefined,
    };

    // Support for excluding conversation knowledge bases
    const excludeConversations = searchParams.get('exclude_conversations') === 'true';

    // Add conversationId support for query history loading
    const conversationId = searchParams.get('conversationId');
    const provider_type_sub_id = searchParams.get('provider_type_sub_id') || conversationId;

    console.log('Knowledge base list request:', {
      userId: user.id,
      page,
      limit,
      offset,
      filters
    });

    const supabase = await getSupabase();
    
    // Build query
    let query = supabase
      .from('knowledge_bases')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.provider_type) {
      query = query.eq('provider_type', filters.provider_type);
    }
    if (provider_type_sub_id) {
      query = query.eq('provider_type_sub_id', provider_type_sub_id);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }
    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }
    if (filters.has_summary) {
      query = query.not('summary', 'is', null);
    }
    if (filters.has_faqs) {
      query = query.not('faq', 'is', null);
    }

    // Exclude conversation knowledge bases if requested (type 4 = conversations)
    if (excludeConversations) {
      query = query.neq('type', 4);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching knowledge bases:', error);
      return Response.json({
        success: false,
        error: 'Failed to fetch knowledge bases'
      } satisfies ErrorResponse, { status: 500 });
    }

    return Response.json({
      success: true,
      data: data as KnowledgeBase[],
      total: count || 0
    } satisfies KnowledgeBasesResponse);

  } catch (error) {
    console.error('Error in knowledge base list:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// POST - Create new knowledge base
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const body = await req.json() as KnowledgeBaseInsert;
    
    // Validate required fields
    if (!body.name || !body.type || !body.provider_type) {
      return Response.json({
        success: false,
        error: 'Missing required fields: name, type, provider_type'
      } satisfies ErrorResponse, { status: 400 });
    }

    console.log('Knowledge base creation request:', {
      userId: user.id,
      name: body.name,
      type: body.type,
      provider_type: body.provider_type
    });

    const supabase = await getSupabase();
    
    // Prepare insert data
    const insertData: KnowledgeBaseInsert = {
      ...body,
      user_id: user.id,
      data: body.data || {},
      faq: body.faq || [],
    };

    const { data, error } = await supabase
      .from('knowledge_bases')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating knowledge base:', error);
      return Response.json({
        success: false,
        error: 'Failed to create knowledge base'
      } satisfies ErrorResponse, { status: 500 });
    }

    return Response.json({
      success: true,
      data: data as KnowledgeBase
    } satisfies KnowledgeBaseResponse);

  } catch (error) {
    console.error('Error in knowledge base creation:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 