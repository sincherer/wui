import { Eye, Paintbrush, Save } from "lucide-react";
import { useRightPanel, useSavePage, useCurrentPage } from "../core/hooks";


import { Button } from "../ui";



export default function RightTop({ websiteId }: { websiteId: string }) {

  const [panel, setRightPanel] = useRightPanel();
  const { savePage, saveState } = useSavePage();
  const currentPage = useCurrentPage();
  return (
    <div className="flex items-center gap-2 rounded-lg bg-background p-2">
      <Button
        variant={panel === "theme" ? "secondary" : "ghost"}
        size="sm"
        className="gap-2"
        onClick={() => setRightPanel(panel !== "theme" ? "theme" : "block")}>
        <Paintbrush className="h-4 w-4" />
        Theme
      </Button>
      {currentPage && (
        <a href={`/website/${websiteId}/${encodeURIComponent(currentPage.name || 'home')}/preview`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </a>
      )}
      <Button variant="default" size="sm" className="gap-2" onClick={() => savePage(false)}>
        <Save className="h-4 w-4" />
        {saveState === "UNSAVED" ? "Draft" : "Saved"}
      </Button>
    </div>
  );
}
