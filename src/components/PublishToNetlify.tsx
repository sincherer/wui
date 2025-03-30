import { Button } from "../ui/shadcn/components/ui/button";

interface PublishToNetlifyProps {
  websiteId: string;
  pages: any[];
}

export const PublishToNetlify = ({ websiteId, pages }: PublishToNetlifyProps) => {
  const handleDeploy = async () => {
    try {
      const response = await fetch("/api/deploy/netlify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteId,
          pages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to deploy to Netlify");
      }

      const result = await response.json();
      alert(`Successfully deployed to Netlify! Site URL: ${result.siteUrl}`);
    } catch (error) {
      console.error("Netlify deployment error:", error);
      alert("Failed to deploy to Netlify");
    }
  };

  return (
    <Button onClick={handleDeploy} variant="outline" size="sm">
      <img src="/netlify-icon.svg" alt="Netlify" className="mr-2 h-4 w-4" />
      Deploy to Netlify
    </Button>
  );
};