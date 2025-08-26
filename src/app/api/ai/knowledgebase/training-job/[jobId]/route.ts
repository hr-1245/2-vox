import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';

interface ErrorResponse {
  success: false;
  error: string;
}

interface TrainingJobStatus {
  jobId: string;
  status: 'pending' | 'training' | 'completed' | 'failed';
  progress?: number;
  documentsProcessed?: number;
  vectorsCreated?: number;
  completedAt?: string;
  error?: string;
  knowledgebaseId?: string;
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

// GET - Check training job status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const resolvedParams = await params;
    const { jobId } = resolvedParams;
    if (!jobId) {
      return Response.json({
        success: false,
        error: 'Job ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    console.log('Training job status request:', {
      userId: user.id,
      jobId: jobId
    });

    // Check job status with FastAPI
    const statusResponse = await fetch(`${FASTAPI_URL}/ai/conversation/training/job/${jobId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.id}`
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('FastAPI job status check failed:', errorText);
      
      return Response.json({
        success: false,
        error: `Failed to check job status: ${errorText}`
      } satisfies ErrorResponse, { status: statusResponse.status });
    }

    const jobStatus = await statusResponse.json() as TrainingJobStatus;
    console.log('Training job status:', jobStatus);

    // If job is completed or failed, update the knowledge base
    if (jobStatus.knowledgebaseId && (jobStatus.status === 'completed' || jobStatus.status === 'failed')) {
      const supabase = await getSupabase();
      
      // Verify knowledge base belongs to user
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_bases')
        .select('*')
        .eq('id', jobStatus.knowledgebaseId)
        .eq('user_id', user.id)
        .single();

      if (!kbError && kbData) {
        const updateData = {
          ...kbData.data,
          processing_status: jobStatus.status,
          training_progress: jobStatus.progress || 100,
          documents_processed: jobStatus.documentsProcessed,
          vectors_created: jobStatus.vectorsCreated,
          training_completed_at: jobStatus.completedAt || new Date().toISOString()
        };

        if (jobStatus.status === 'failed' && jobStatus.error) {
          updateData.training_error = jobStatus.error;
        }

        await supabase
          .from('knowledge_bases')
          .update({ data: updateData })
          .eq('id', jobStatus.knowledgebaseId);

        console.log('Updated knowledge base with job status:', jobStatus.knowledgebaseId);
      }
    }

    return Response.json({
      success: true,
      data: jobStatus
    });

  } catch (error) {
    console.error('Error checking training job status:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 