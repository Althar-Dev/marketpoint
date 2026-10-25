import { EmailTemplatePreview } from "@/components/email-template-preview";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview Template Email - MarketPointID",
  description: "Live preview dan simulator responsif template email resmi MarketPointID.",
};

export default function EmailPreviewPage() {
  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col">
      <EmailTemplatePreview />
    </div>
  );
}
