import { Button } from "../ui/shadcn/components/ui/button";
import { Plus, ChevronRight, ChevronDown, Trash2, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "../ui/shadcn/components/ui/input";


export interface Page {
  id: string;
  name: string;
  blocks: any[];
  children?: Page[];
}

interface PageManagementPanelProps {
  pages: Page[];
  currentPageId: string;
  onPageAdd: (parentId?: string) => void;
  onPageDelete: (pageId: string) => void;
  onPageSelect: (pageId: string, websiteId: string) => void;
  onPageRename: (pageId: string, newName: string) => void;
  websiteId: string;
}

export const PageManagementPanel = ({
  pages,
  currentPageId,
  onPageAdd,
  onPageDelete,
  onPageSelect,
  onPageRename,
  websiteId
  
}: PageManagementPanelProps) => {
  const [expandedPages, setExpandedPages] = useState<string[]>([]);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const togglePageExpand = (pageId: string) => {
    setExpandedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const startEditing = (page: Page) => {
    setEditingPageId(page.id);
    setEditingName(page.name);
  };

  const handleRename = () => {
    if (editingPageId && editingName.trim()) {
      onPageRename(editingPageId, editingName.trim());
      setEditingPageId(null);
    }
  };

  const cancelEditing = () => {
    setEditingPageId(null);
  };

  const renderPages = (pages: Page[]) => {
    return pages.map((page) => (
      <div key={page.id} className="flex flex-col ml-4">
        <div
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
            currentPageId === page.id ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
          onClick={() => onPageSelect(page.id, websiteId)}
        >
          <div className="flex items-center gap-1 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                togglePageExpand(page.id);
              }}
            >
              {expandedPages.includes(page.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            {editingPageId === page.id ? (
              <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-6 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRename();
                    } else if (e.key === 'Escape') {
                      cancelEditing();
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleRename}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={cancelEditing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span className="text-sm flex-1">{page.name}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                startEditing(page);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onPageAdd(page.id);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            {pages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onPageDelete(page.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {expandedPages.includes(page.id) && page.children && renderPages(page.children)}
      </div>
    ));
  };

  return (
    <div className="flex flex-col gap-2 p-4 border-b">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pages</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onPageAdd()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        {renderPages(pages)}
      </div>
      
    </div>
  );
};