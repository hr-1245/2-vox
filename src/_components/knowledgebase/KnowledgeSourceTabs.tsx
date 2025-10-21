"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FileTable from "./FileTable";
import UrlTable from "./UrlTable";
import FaqTable from "./FaqTable";
import { FileText, MessageSquare, ExternalLink } from "lucide-react";

export default function KnowledgeSourceTabs({ kb }: { kb: any }) {
  const router = useRouter();

  // --- Track active tab ---
  const [activeTab, setActiveTab] = useState("all");

  const counts = {
    files: kb?.sources?.files?.data?.length || 0,
    faqs: kb?.sources?.faqs?.data?.length || 0,
    webUrls: kb?.sources?.webUrls?.data?.length || 0,
  };

  const cards: {
    key: keyof typeof counts;
    label: string;
    icon: React.ReactNode;
    tab: string;
  }[] = [
    {
      key: "files",
      label: "Files",
      icon: <FileText className="w-6 h-6" />,
      tab: "files",
    },
    {
      key: "faqs",
      label: "FAQs",
      icon: <MessageSquare className="w-6 h-6" />,
      tab: "faqs",
    },
    {
      key: "webUrls",
      label: "Web URLs",
      icon: <ExternalLink className="w-6 h-6" />,
      tab: "webUrls",
    },
  ];

  function gotoTab(tab: string) {
    setActiveTab(tab);
    router.replace(`?tab=${tab}`, { scroll: false });
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full mt-4"
    >
      <TabsList className="grid grid-cols-4 w-full sm:w-auto">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="webUrls">Web URLs</TabsTrigger>
        <TabsTrigger value="faqs">FAQs</TabsTrigger>
      </TabsList>

      {/* ------------- ALL SOURCES ------------- */}
      <TabsContent value="all" className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div
              key={c.key}
              onClick={() => gotoTab(c.tab)}
              className="border rounded-lg p-5 hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-white">{c.label}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {counts[c.key]}
                </p>
              </div>
              <div className="text-gray-400">{c.icon}</div>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* ------------- DEDICATED TABS ------------- */}
      <TabsContent value="files" className="mt-4">
        <FileTable files={kb?.sources?.files?.data} />
      </TabsContent>

      <TabsContent value="webUrls" className="mt-4">
        <UrlTable urls={kb?.sources?.webUrls?.data} />
      </TabsContent>

      <TabsContent value="faqs" className="mt-4">
        <FaqTable faqs={kb?.sources?.faqs?.data} />
      </TabsContent>
    </Tabs>
  );
}
