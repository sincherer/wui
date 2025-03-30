import { Button } from "../ui/shadcn/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PublishToVercelProps {
  websiteId: string;
  onPublish: (websiteId: string) => Promise<void>;
}

export function PublishToVercel({ websiteId, onPublish }: PublishToVercelProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish(websiteId);
    } catch (error) {
      console.error("Error publishing to Vercel:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Button
      onClick={handlePublish}
      disabled={isPublishing}
      className="flex items-center gap-2"
    >
      {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
      {isPublishing ? "Publishing..." : "Publish to Vercel"}
    </Button>
  );
}