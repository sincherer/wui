import { Button } from "../ui/shadcn/components/ui/button";
import { Github } from "lucide-react";

interface PublishToGithubProps {
  websiteId: string;
  pages: any[];
}

export const PublishToGithub = ({ websiteId, pages }: PublishToGithubProps) => {
  const handleDeploy = async () => {
    try {
      const response = await fetch("/api/deploy/github-pages", {
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
        throw new Error("Failed to deploy to GitHub");
      }

      const result = await response.json();
      alert(`Successfully published to GitHub! Repository URL: ${result.repoUrl}`);
    } catch (error) {
      console.error("GitHub deployment error:", error);
      alert("Failed to deploy to GitHub");
    }
  };

  return (
    <Button onClick={handleDeploy} variant="outline" size="sm">
      <Github className="mr-2 h-4 w-4" />
      Deploy to GitHub
    </Button>
  );
};