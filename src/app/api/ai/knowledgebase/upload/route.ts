import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { postFastAPI } from '@/lib/fastapi-utils';
import { 
  KnowledgeBase, 
  KnowledgeBaseInsert, 
  KnowledgeBaseResponse,
  FileUpload 
} from '@/utils/database/knowledgebase';
import { KB_SETTINGS } from '@/utils/ai/knowledgebaseSettings';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';

interface ErrorResponse {
  success: false;
  error: string;
}

interface FileUploadRequest {
  fileName: string;
  fileContent: string; // Base64 encoded content or file data
  mimeType: string;
  size: number;
  metadata?: Record<string, any>;
}

// Get bucket name from environment or use fallback
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'knowledge-base-files';

// POST - Upload file and create knowledge base entry
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const body = await req.json() as FileUploadRequest;
    
    // Validate required fields
    if (!body.fileName || !body.fileContent || !body.mimeType) {
      return Response.json({
        success: false,
        error: 'Missing required fields: fileName, fileContent, mimeType'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (body.size > maxSize) {
      return Response.json({
        success: false,
        error: 'File size exceeds maximum limit of 10MB'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/json'
    ];

    if (!allowedTypes.includes(body.mimeType)) {
      return Response.json({
        success: false,
        error: 'Unsupported file type. Allowed types: TXT, CSV, PDF, DOC, DOCX, JSON'
      } satisfies ErrorResponse, { status: 400 });
    }

    console.log('File upload request:', {
      userId: user.id,
      fileName: body.fileName,
      mimeType: body.mimeType,
      size: body.size
    });

    const supabase = await getSupabase();
    
    // Generate unique file ID and smart file path
    const fileId = crypto.randomUUID();
    const uploadedAt = new Date().toISOString();
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Create smart file path: user_id/kb_type/date/file_id_original_name
    const fileExtension = body.fileName.split('.').pop() || '';
    const sanitizedFileName = body.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/kb_files/${timestamp}/${fileId}_${sanitizedFileName}`;
    
    // Convert base64 to buffer for upload
    const fileBuffer = Buffer.from(body.fileContent, 'base64');
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: body.mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return Response.json({
        success: false,
        error: `Failed to upload file: ${uploadError.message}`
      } satisfies ErrorResponse, { status: 500 });
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const fileData: FileUpload = {
      id: fileId,
      filename: sanitizedFileName,
      original_name: body.fileName,
      mime_type: body.mimeType,
      size: body.size,
      url: urlData.publicUrl,
      uploaded_at: uploadedAt,
      processed: false,
      metadata: {
        ...body.metadata,
        storage_path: filePath,
        bucket_name: BUCKET_NAME,
        file_extension: fileExtension
      }
    };

    // Create knowledge base entry
    const insertData: KnowledgeBaseInsert = {
      name: `File: ${body.fileName}`,
      type: KB_SETTINGS.KB_FILE_UPLOAD.type,
      user_id: user.id,
      provider_type: PROVIDER_TYPE.GHL_LOCATION, // Default provider
      provider_type_sub_id: fileId,
      data: {
        file: fileData,
        upload_date: uploadedAt,
        processing_status: 'pending',
        extracted_text: '', // Will be populated after processing
        file_ids: [fileId], // Array of file IDs for retrieval
        storage_info: {
          bucket: BUCKET_NAME,
          path: filePath,
          public_url: urlData.publicUrl
        },
        metadata: {
          ...body.metadata,
          uploaded_by: user.id,
          upload_method: 'api',
          file_type: KB_SETTINGS.KB_FILE_UPLOAD.name,
          mime_type: body.mimeType,
          original_size: body.size
        }
      },
      faq: [],
      file_uploads: fileId
    };

    const { data, error } = await supabase
      .from('knowledge_bases')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating file knowledge base:', error);
      return Response.json({
        success: false,
        error: 'Failed to create file knowledge base'
      } satisfies ErrorResponse, { status: 500 });
    }

    // After successful file upload, start async training
    try {
      const trainingResponse = await postFastAPI('/ai/conversation/training/supabase-file', {
          userId: user.id,
          knowledgebaseId: data.id,
        supabaseFilePath: filePath,
          fileName: body.fileName,
          fileType: body.mimeType,
          metadata: {
          source: 'file_upload',
          uploadedAt: new Date().toISOString(),
          fileSize: body.size
            }
      }, { userId: user.id });

      if (trainingResponse.ok) {
        const trainingData = await trainingResponse.json();
        console.log('File training completed:', trainingData);
        
        // Update knowledge base with training results
        await supabase
          .from('knowledge_bases')
          .update({
            data: {
              ...data.data,
              processing_status: 'completed',
              documents_processed: trainingData.documentsProcessed || 1,
              vectors_created: trainingData.vectorsCreated || 0,
              training_completed_at: trainingData.timestamp || new Date().toISOString(),
              extracted_text: trainingData.extractedText || '',
              training_results: trainingData
            }
          })
          .eq('id', data.id);
      } else {
        // Handle training failure
        const errorText = await trainingResponse.text();
        console.error('FastAPI training failed:', errorText);
        
        await supabase
          .from('knowledge_bases')
          .update({
            data: {
              ...data.data,
              processing_status: 'failed',
              training_error: errorText
            }
          })
          .eq('id', data.id);
      }
    } catch (trainingError) {
      console.error('Failed to start training job:', trainingError);
      
      // Update status to failed
      await supabase
        .from('knowledge_bases')
        .update({
          data: {
            ...data.data,
            processing_status: 'failed',
            training_error: trainingError instanceof Error ? trainingError.message : 'Unknown error'
          }
        })
        .eq('id', data.id);
    }

    console.log('File uploaded successfully:', {
      knowledgeBaseId: data.id,
      fileId: fileId,
      fileName: body.fileName
    });

    return Response.json({
      success: true,
      data: data as KnowledgeBase
    } satisfies KnowledgeBaseResponse);

  } catch (error) {
    console.error('Error in file upload:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 