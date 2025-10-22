import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";
import { getSupabase } from "@/utils/supabase/getSupabase";

export async function DELETE(req: NextRequest, context: any) {
  const srcId = context?.params?.id;
  const SOFT_DELETE = false;

  try {
    // --- 1. Validate user ---
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --- 2. Parse body (optional) ---
    const body = await req.json().catch(() => null);
    const kbId = body?.kbId;
    if (!kbId) {
      return NextResponse.json(
        { success: false, error: "Knowledge base ID (kbId) is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    // --- 3. Verify source belongs to KB ---
    const { data: source, error: findError } = await supabase
      .from("kb_source")
      .select("id, kb_id")
      .eq("id", srcId)
      .eq("kb_id", kbId)
      .single();

    if (findError || !source) {
      console.error("❌ Supabase findError:", findError);
      return NextResponse.json(
        { success: false, error: "Source not found or access denied" },
        { status: 404 }
      );
    }

    // --- 4. Perform deletion ---
    if (SOFT_DELETE) {
      const { error: updateError } = await supabase
        .from("kb_source")
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq("id", srcId)
        .eq("kb_id", kbId);
      if (updateError) throw updateError;
    } else {
      const { error: deleteError } = await supabase
        .from("kb_source")
        .delete()
        .eq("id", srcId)
        .eq("kb_id", kbId);
      if (deleteError) throw deleteError;
    }

    // --- 5. Return success ---
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error("❌ DELETE error:", e);
    return NextResponse.json(
      { success: false, error: e.message || "Unknown error" },
      { status: 500 }
    );
  }
}
