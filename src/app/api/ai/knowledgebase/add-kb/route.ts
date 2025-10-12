import { NextRequest } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";

interface ErrorResponse {
  success: false;
  error: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json(
        { success: false, error: "Unauthorized" } satisfies ErrorResponse,
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const name = formData.get("name")?.toString().trim();
    if (!name) {
      return Response.json(
        { success: false, error: "name is required" } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    // --- 1.  name must be unique per user  ----------------------------------
    const { data: existing } = await supabase
      .from("kb")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", name)
      .single(); // returns null if not found

    if (existing) {
      return Response.json(
        {
          success: false,
          error: "A knowledge base with this name already exists",
        } satisfies ErrorResponse,
        { status: 409 }
      );
    }

    const urls = formData.get("urls")
      ? JSON.parse(formData.get("urls")!.toString())
      : [];
    const faqs = formData.get("faqs")
      ? JSON.parse(formData.get("faqs")!.toString())
      : [];
    const files = formData.getAll("files") as File[];

    const { data: kb, error }: any = await supabase
      .from("kb")
      .insert([{ name, user_id: user.id, status: "pending" }] as any)
      .select("id,name,status")
      .single();

    if (error) throw error;

    // after KB insert

    // file sources
    for (const file of files) {
      const storagePath = `${kb.id}/raw/${Date.now()}_${file.name}`;

      // server-side upload into Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("kb-uploads")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // record source row with the path we just stored
      await supabase.from("kb_source").insert([
        {
          kb_id: kb.id,
          type: "file",
          data: {
            fileName: file.name,
            path: storagePath,
            size: file.size,
            type: file.type,
          },
          status: "pending",
        },
      ] as any);

      // >>>  CALL FASTAPI FOR THIS FILE  <<<
      const fastRes = await fetch(
        `${process.env.NEXT_PUBLIC_VOX_API_URL}/ai/conversation/kb/add-files`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
          body: JSON.stringify({
            userId: user.id,
            knowledgebaseId: kb.id,
            fileId: storagePath, // unique path in bucket
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            storagePath: storagePath,
            supabaseBucket: "kb-uploads",
          }),
        }
      );

      if (!fastRes.ok) {
        const msg = await fastRes.text();
        console.warn("FastAPI rejected file job:", msg);
        // decide: throw or keep going
      }
    }

    // web sources
    for (const url of urls) {
      await supabase
        .from("kb_source")
        .insert([
          { kb_id: kb.id, type: "web", data: { url }, status: "pending" },
        ] as any);

      // queue crawl job
      const crawlRes = await fetch(
        `${process.env.NEXT_PUBLIC_VOX_API_URL}/ai/conversation/kb/add-web`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
          body: JSON.stringify({
            userId: user.id,
            knowledgebaseId: kb.id,
            url,
          }),
        }
      );

      if (!crawlRes.ok) {
        const msg = await crawlRes.text();
        console.warn("FastAPI rejected crawl job:", msg);
      }
    }

    for (const { question, answer } of faqs) {
      await supabase.from("kb_source").insert([
        {
          kb_id: kb.id,
          type: "faq",
          data: { q: question, a: answer },
          status: "pending",
        },
      ] as any);
    }

    // after inserting kb_source rows (optional), kick off embedding
    if (faqs.length) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_VOX_API_URL}/ai/conversation/kb/add-faqs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`, // same token used for KB create
          },
          body: JSON.stringify({
            userId: user.id,
            knowledgebaseId: kb.id,
            faqs,
          }),
        }
      );

      if (!res.ok) throw new Error("FAQ embedding failed");
    }

    return Response.json({
      success: true,
      data: {
        kbId: kb.id,
        name: kb.name,
        status: kb.status,
        sources: { web: urls.length, faq: faqs.length, file: files.length },
      },
    });
  } catch (e: any) {
    console.error("❌ unified kb error:", e);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
