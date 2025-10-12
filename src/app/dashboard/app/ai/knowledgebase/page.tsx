"use client";
import { KBTable } from "@/_components/knowledgebase/KBTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function KnowledgeBasePage() {
  const router = useRouter();

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-[#ef3d6d] bg-clip-text text-transparent">
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage your AI training data and resources
          </p>
        </div>
        <Button
          onClick={() =>
            router.push("/dashboard/app/ai/knowledgebase/add-knowledge-base")
          }
          className="bg-[#ef3d6d] hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Knowledge Base
        </Button>
      </div>

      {/* Self-fetching table with actions, no checkboxes */}
      <KBTable showActions />
    </div>
  );
}
