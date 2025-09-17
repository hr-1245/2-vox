"use client";
import React from "react";

import CustomerSupportAgent from "@/_components/knowledgebase/CustomerSupportAgent";
import SetupProgress from "@/_components/knowledgebase/SetupProgress";
import ChooseYouContentSource from "@/_components/knowledgebase/ChooseYouContentSource";
import UploadComponent from "@/_components/knowledgebase/UploadComponent";

const AddKnowledgeBasePage = () => {
  return (
    <div className="min-h-screen px-4 py-6 md:px-10 lg:px-16">
      {/* Header */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center">
        Build Your AI Knowledge Base
      </h1>
      <p className="mt-3 text-sm md:text-base text-gray-300 text-center max-w-2xl mx-auto leading-relaxed">
        Transform your content into intelligent conversations. Upload files,
        import data, and train your AI agent with multiple content sources in
        just a few simple steps.
      </p>

      {/* CustomerSupportAgent Card */}
      <CustomerSupportAgent />

      {/* SetupProgress Card */}
      <SetupProgress />

      {/* Chooose Your Content Source */}
      <ChooseYouContentSource />

      {/* Upload Component */}
      <UploadComponent />
    </div>
  );
};

export default AddKnowledgeBasePage;
