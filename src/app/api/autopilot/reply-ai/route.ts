// // app/api/autopilot/reply-ai/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getSupabase } from "@/utils/supabase/getSupabase";
// import { groq } from "@ai-sdk/groq";
// import { generateText } from "ai";

// export async function POST(request: NextRequest) {
//   try {
//     // 1. Auth check
//     const supabase = await getSupabase();
//     const { data: userData, error: userError } = await supabase.auth.getUser();
//     if (userError || !userData?.user) {
//       return NextResponse.json(
//         { error: "Authentication required" },
//         { status: 401 }
//       );
//     }

//     // 2. Extract body
//     const { message } = await request.json();
//     if (!message) {
//       return NextResponse.json({ error: "Text is required" }, { status: 400 });
//     }

//     // 3. Call Groq model
//     const { text: aiReply } = await generateText({
//       model: groq("llama-3.1-8b-instant"), // or another Groq model
//       prompt: `You are a helpful assistant that replies clearly and politely to customer messages. Message: "${message}"`,
//     });

//     if (!aiReply) {
//       throw new Error("Groq returned empty reply");
//     }

//     // 4. Respond
//     return NextResponse.json({ reply: aiReply }, { status: 200 });
//   } catch (error) {
//     console.error("💥 Error in AI Reply API:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to generate AI reply",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

// ✅ Supabase table for deduplication
// create table processed_messages (
//   message_id text primary key,
//   created_at timestamptz default now()
// );

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { message, messageId } = await request.json();
    if (!message || !messageId) {
      return NextResponse.json(
        { error: "Message and messageId are required" },
        { status: 400 }
      );
    }

    // ✅ Check deduplication in Supabase
    const { data: existing } = await supabase
      .from("processed_messages")
      .select("message_id")
      .eq("message_id", messageId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    await supabase.from("processed_messages").insert({ message_id: messageId });

    // ✅ Call Groq AI model
    const { text: aiReply } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `You are a helpful assistant that replies clearly and politely to customer messages. Message: "${message}"`,
    });

    if (!aiReply) {
      throw new Error("Groq returned empty reply");
    }

    return NextResponse.json({ reply: aiReply }, { status: 200 });
  } catch (error) {
    console.error("💥 Error in AI Reply API:", error);
    return NextResponse.json(
      { error: "Failed to generate AI reply", details: (error as Error).message },
      { status: 500 }
    );
  }
}
