import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { 
  KnowledgeBase, 
  KnowledgeBaseUpdate, 
  KnowledgeBaseResponse 
} from '@/utils/database/knowledgebase';

interface ErrorResponse {
  success: false;
  error: string;
}

// GET - Get single knowledge base
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return Response.json({
        success: false,
        error: 'Knowledge base ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    console.log('Knowledge base get request:', {
      userId: user.id,
      knowledgeBaseId: id
    });

    const supabase = await getSupabase();
    
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({
          success: false,
          error: 'Knowledge base not found'
        } satisfies ErrorResponse, { status: 404 });
      }
      
      console.error('Error fetching knowledge base:', error);
      return Response.json({
        success: false,
        error: 'Failed to fetch knowledge base'
      } satisfies ErrorResponse, { status: 500 });
    }

    // Check training job status if available
    if (data.data?.training_job_id) {
      try {
        const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
        const statusResponse = await fetch(`${FASTAPI_URL}/ai/conversation/training/job/${data.data.training_job_id}/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.id}`
          }
        });

        if (statusResponse.ok) {
          const jobStatus = await statusResponse.json();
          
          // Update knowledge base with latest training status
          if (jobStatus.status !== data.data.training_status) {
            await supabase
              .from('knowledge_bases')
              .update({
                data: {
                  ...data.data,
                  training_status: jobStatus.status,
                  training_progress: jobStatus.progress,
                  documents_processed: jobStatus.documentsProcessed,
                  vectors_created: jobStatus.vectorsCreated,
                  training_completed_at: jobStatus.completedAt,
                  training_error: jobStatus.error
                }
              })
              .eq('id', id);
            
            // Refresh data with updated status
            const { data: updatedData } = await supabase
              .from('knowledge_bases')
              .select('*')
              .eq('id', id)
              .eq('user_id', user.id)
              .single();
            
            if (updatedData) {
              // Update the response data
              Object.assign(data, updatedData);
            }
          }
        }
      } catch (statusError) {
        console.error('Failed to check training job status:', statusError);
      }
    }

    return Response.json({
      success: true,
      data: data as KnowledgeBase
    } satisfies KnowledgeBaseResponse);

  } catch (error) {
    console.error('Error in knowledge base get:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// PUT - Update knowledge base
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return Response.json({
        success: false,
        error: 'Knowledge base ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    const body = await req.json() as KnowledgeBaseUpdate;

    console.log('Knowledge base update request:', {
      userId: user.id,
      knowledgeBaseId: id,
      updates: Object.keys(body)
    });

    const supabase = await getSupabase();
    
    // Add updated_at timestamp
    const updateData: KnowledgeBaseUpdate = {
      ...body,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('knowledge_bases')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({
          success: false,
          error: 'Knowledge base not found'
        } satisfies ErrorResponse, { status: 404 });
      }
      
      console.error('Error updating knowledge base:', error);
      return Response.json({
        success: false,
        error: 'Failed to update knowledge base'
      } satisfies ErrorResponse, { status: 500 });
    }

    return Response.json({
      success: true,
      data: data as KnowledgeBase
    } satisfies KnowledgeBaseResponse);

  } catch (error) {
    console.error('Error in knowledge base update:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}

// DELETE - Delete knowledge base
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return Response.json({
        success: false,
        error: 'Knowledge base ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    console.log('Knowledge base delete request:', {
      userId: user.id,
      knowledgeBaseId: id
    });

    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('knowledge_bases')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting knowledge base:', error);
      return Response.json({
        success: false,
        error: 'Failed to delete knowledge base'
      } satisfies ErrorResponse, { status: 500 });
    }

    return Response.json({
      success: true,
      data: null
    });

  } catch (error) {
    console.error('Error in knowledge base delete:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 