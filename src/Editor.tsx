import axios from "axios";
import { useAtom } from "jotai";
import { isArray, map, pick, values } from "lodash-es";
import { ScrollText, ArrowLeft, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { lsAiContextAtom, lsBlocksAtom, lsThemeAtom } from "./__dev/atoms-dev.ts";
import registerCustomBlocks from "./__dev/blocks/index.tsx";
import GalleryWidget from "./__dev/CustomWidget.tsx";
import { LanguageButton } from "./__dev/LangButton.tsx";
import PreviewWeb from "./__dev/preview/WebPreview.tsx";
import RightTop from "./__dev/RightTop.tsx";
import { bluePreset, greenPreset, orangePreset } from "./__dev/THEME_PRESETS.ts";
import { ChaiBlock, ChaiBuilderEditor, getBlocksFromHTML, PERMISSIONS } from "./core/main";
import { SavePageData } from "./core/types/chaiBuilderEditorProps.ts";
import { Alert, AlertDescription } from "./ui/shadcn/components/ui/alert.tsx";
import { DropdownMenuItem } from "./ui/shadcn/components/ui/dropdown-menu.tsx";
import { loadWebBlocks } from "./web-blocks";
import { PageManagementPanel } from "./__dev/PageManagementPanel";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "./core/utils/supabase";
import { getCurrentUser, getPages, createPage, updatePage, deletePage, getWebsiteById } from "./core/lib/auth";
import { DeployButton } from "./components/DeployButton";

// Load web blocks and register custom blocks
loadWebBlocks();
registerCustomBlocks();

// Console error handling at the end
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes("Warning: TextareaWidget: Support for defaultProps") ||
    args[0]?.includes("Warning: Using UNSAFE_componentWillReceiveProps")
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Logo Component
const Logo = () => {
  // Get website ID from URL
  const getWebsiteId = () => {
    const pathSegments = window.location.pathname.split("/");
    return pathSegments[pathSegments.indexOf("website") + 1];
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => (window.location.href = `/website/${getWebsiteId()}/setup`)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
    </div>
  );
};

// Demo Alert Component
const DemoAlert = () => {
  return (
    <Alert variant="default" className="px-4 py-2" aria-describedby="dialog-description">
      <AlertDescription className="flex items-center gap-2" id="dialog-description">
        <Info className="h-4 w-4" />
        <span className="font-bold">Demo mode</span> - Changes are saved in your browser local storage. AI actions are
        mocked.
      </AlertDescription>
    </Alert>
  );
};

// Media Manager Component
const MediaManagerComponent = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-full items-center justify-center pt-20">Implement your media manager here</div>
    </div>
  );
};

// Save to Library Dropdown Item
const SaveToLibrary = ({ block }: { block: ChaiBlock }) => {
  return (
    <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => console.log(block)}>
      Save to library
    </DropdownMenuItem>
  );
};

// Main Component
function ChaiBuilderDefault() {
  const [blocks, setBlocks] = useAtom(lsBlocksAtom);
  const [theme, setTheme] = useAtom(lsThemeAtom);
  const [aiContext, setAiContext] = useAtom(lsAiContextAtom);

  // State for pages and current page
  const [pages, setPages] = useState<
    Array<{
      id: string;
      name: string;
      blocks: any[];
      created_at: string;
      updated_at: string;
    }>
  >([]);

  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  // State for website_id
  const [websiteId, setWebsiteId] = useState<string | null>(null);

  // Effect to initialize website_id if not already set
  useEffect(() => {
    const initializeWebsiteId = async () => {
      try {
        // Get website ID from URL
        const urlParams = new URL(window.location.href);
        const pathSegments = urlParams.pathname.split("/");
        const websiteIdFromUrl = pathSegments[pathSegments.indexOf("website") + 1];

        if (!websiteIdFromUrl) {
          throw new Error("No website ID found in URL");
        }

        const { data: website, error } = await supabase
          .from("websites")
          .select("id")
          .eq("id", websiteIdFromUrl)
          .single();

        if (error) throw error;
        if (!website) throw new Error("Website not found");

        setWebsiteId(website.id);
      } catch (error) {
        console.error("Error initializing website:", error);
        alert(`Website initialization failed: ${error.message}`);
      }
    };

    if (!websiteId) {
      initializeWebsiteId();
    }
  }, [websiteId]);

  // Effect to load pages when websiteId changes
  useEffect(() => {
    const loadPages = async () => {
      if (!websiteId) return;

      try {
        const user = await getCurrentUser();
        const website = await getWebsiteById(websiteId);

        if (!website) {
          throw new Error("Website not found");
        }

        const pagesData = await getPages(websiteId);

        if (pagesData && pagesData.length > 0) {
          setPages(pagesData);
          setCurrentPageId(pagesData[0]?.id || null);
        } else {
          // Initialize with default page if none exists
          const defaultPage = {
            id: uuidv4(),
            name: "Home",
            blocks: blocks,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            website_id: websiteId,
            user_id: user.id,
          };

          const newPage = await createPage(defaultPage);
          setPages([newPage]);
          setCurrentPageId(newPage.id);
        }
      } catch (error) {
        console.error("Error loading pages:", error);
        setWebsiteId(null); // Reset website ID if website not found
      }
    };

    loadPages();
  }, [websiteId]);

  // Handle page addition
  const handlePageAdd = async () => {
    if (!websiteId) {
      console.error("No website ID available");
      return;
    }

    try {
      const user = await getCurrentUser();
      const currentPageBlocks = currentPage?.blocks || [];

      const newPage = {
        id: uuidv4(),
        website_id: websiteId,
        user_id: user.id,
        name: `Page ${pages.length + 1}`,
        blocks: currentPageBlocks,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const createdPage = await createPage(newPage);
      setPages([...pages, createdPage]);
      setCurrentPageId(createdPage.id);
    } catch (error) {
      console.error("Error adding page:", error);
    }
  };

  // Handle page deletion
  const handlePageDelete = async (pageId: string) => {
    try {
      await deletePage(pageId, websiteId!);
      const newPages = pages.filter((page) => page.id !== pageId);
      setPages(newPages);

      if (currentPageId === pageId) {
        setCurrentPageId(newPages[0]?.id || null);
      }
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  // Handle page renaming
  const handlePageRename = async (pageId: string, newName: string) => {
    try {
      await updatePage(pageId, { name: newName });
      setPages(pages.map((page) => (page.id === pageId ? { ...page, name: newName } : page)));
    } catch (error) {
      console.error("Error renaming page:", error);
    }
  };

  // Handle block updates
  const handleBlocksUpdate = async (newBlocks: any[]) => {
    try {
      const user = await getCurrentUser();
      await updatePage(currentPageId!, {
        blocks: newBlocks,
        updated_at: new Date().toISOString(),
        user_id: user.id,
      });

      setBlocks(newBlocks);
      setPages(pages.map((page) => (page.id === currentPageId ? { ...page, blocks: newBlocks } : page)));
    } catch (error) {
      console.error("Error updating blocks:", error);
    }
  };

  // Get current page and blocks
  const currentPage = pages.find((page) => page.id === currentPageId);
  const currentBlocks = currentPage?.blocks || [];
  

  return (
    <ChaiBuilderEditor
      permissions={[...values(PERMISSIONS)]}
      blockMoreOptions={[SaveToLibrary]}
      mediaManagerComponent={MediaManagerComponent}
      pageExternalData={{
        vehicle: {
          title: "Hyundai i20 Active - 1.0 MPI - 2015",
          description:
            "Hyundai i20 Active - 1.0 MPI - 2015, 100000km, Petrol, Manual, 5 doors, 5 seats. This is a description of my vehicle. It is a car.",
          price: "$2000",
          image: "https://picsum.photos/400/200",
          link: "https://www.google.com",
        },
        global: {
          siteName: "My Site",
          twitterHandle: "@my-twitter-handle",
          description: "This is a description of my page",
        },
      }}
      rjsfWidgets={{ gallery: GalleryWidget }}
      fallbackLang="en"
      languages={["fr"]}
      themePresets={[{ orange: orangePreset }, { green: greenPreset }, { blue: bluePreset }]}
      theme={theme}
      // Remove autoSaveSupport and autoSaveInterval props
      previewComponent={PreviewWeb}
      blocks={currentBlocks}
      onBlocksUpdate={handleBlocksUpdate}
      onSave={async (data: SavePageData) => {
        setPages(pages.map((page) => (page.id === currentPageId ? { ...page, blocks: data.blocks } : page)));

        if (data.theme) setTheme(data.theme);

        try {
          const user = await getCurrentUser();
          if (!websiteId) throw new Error("No website ID available");

          const pagesToUpsert = await Promise.all(
            pages.map(async (page) => ({
              id: page.id,
              name: page.name,
              blocks: page.blocks,
              created_at: page.created_at,
              updated_at: new Date().toISOString(),
              user_id: user.id,
              website_id: websiteId,
            })),
          );

          const { error } = await supabase.from("pages").upsert(pagesToUpsert, { onConflict: "id" });

          if (error) throw error;

          return true;
        } catch (error) {
          console.error("Supabase save error:", error);
          alert(`Failed to save pages: ${error.message}`);
          return false;
        }
      }}
      saveAiContextCallback={async (content: string) => {
        setAiContext(content);
        return true;
      }}
      aiContext={aiContext}
      askAiCallBack={async (type: "styles" | "content", prompt: string, blocks: ChaiBlock[], lang: string = "") => {
        console.log("askAiCallBack", type, prompt, blocks, lang);
        return {
          blocks: map(blocks, (b) => ({
            ...pick(b, ["_id"]),
          })),
          usage: { completionTokens: 151, promptTokens: 227, totalTokens: 378 },
        };
      }}
      getUILibraryBlock={async (uiLibrary, uiLibBlock) => {
        try {
          let html;
          if (uiLibrary.uuid === "hyperui") {
            // For local blocks
            const response = await fetch(`/blocks${uiLibBlock.path}`);
            html = await response.text();
          } else {
            // For remote blocks
            const response = await axios.get(
              uiLibrary.url + (!uiLibBlock.path ? "/" + uiLibBlock.uuid + ".html" : "/blocks/" + uiLibBlock.path),
            );
            html = response.data;
          }
          const htmlWithoutChaiStudio = html.replace(/---([\s\S]*?)---/g, "");
          return getBlocksFromHTML(`${htmlWithoutChaiStudio}`) as ChaiBlock[];
        } catch (error) {
          console.error("Error loading UI library block:", error);
          return [];
        }
      }}
      uiLibraries={[
        { uuid: "meraki-ui", name: "Meraki UI", url: "https://chai-ui-blocks.vercel.app" },
        { uuid: "chaiblocks", name: "UI Blocks", url: "https://www.chaibuilder.com/chaiblocks" }, // Updated URL
        { uuid: "hyperui", name: "HyperUI", url: "/blocks" },
      ]}
      getUILibraryBlocks={async (uiLibrary) => {
        try {
          if (uiLibrary.uuid === "hyperui") {
            // For local blocks
            const response = await fetch("/blocks/blocks.json");
            const blocks = await response.json();
            return blocks.map((b) => ({
              ...b,
              preview: `/blocks${b.preview}`,
            }));
          }

          // For remote blocks, add cache control and cors mode
          const response = await fetch(`${uiLibrary.url}/blocks.json`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            headers: {
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blocks = await response.json();
          return blocks.map((b) => ({
            ...b,
            preview: uiLibrary.url.replace("chaiblocks", "") + b.preview,
          }));
        } catch (error) {
          console.error("Error loading UI library blocks:", error);
          return [];
        }
      }}
      // Replace the existing deployment buttons in topBarComponents
      topBarComponents={{
        left: [Logo],
        center: [DemoAlert],
        right: [
          () =>
            websiteId && <DeployButton websiteId={websiteId} pages={pages} />,
          LanguageButton,
          RightTop,
        ],
      }}
      sideBarComponents={{
        top: [
          {
            icon: <ScrollText className="h-4 w-4" />,
            label: "Pages",
            component: () => (
              <PageManagementPanel
                pages={pages}
                currentPageId={currentPageId}
                onPageAdd={handlePageAdd}
                onPageDelete={handlePageDelete}
                onPageSelect={(pageId) => setCurrentPageId(pageId)}
                onPageRename={handlePageRename}
                websiteId={websiteId}
              />
            ),
          },
        ],
      }}
      getPartialBlockBlocks={async (partialBlockKey: string) => {
        const blocks =
          partialBlockKey === "partial"
            ? [
                {
                  _type: "Box",
                  _id: "header",
                  tag: "div",
                  styles: "#styles:,flex flex-col items-center justify-center h-96",
                },
                {
                  _type: "Span",
                  content: "Span 2",
                  _id: "span",
                  _parent: "header",
                  styles: "#styles:,text-center text-3xl font-bold p-4 bg-gray-100",
                },
                {
                  _type: "Heading",
                  content: "Heading 1",
                  _id: "heading",
                  _parent: "header",
                  styles: "#styles:,text-center text-3xl font-bold p-4 bg-gray-100",
                },
              ]
            : [
                {
                  styles:
                    "#styles:,flex w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800",
                  tag: "div",
                  backgroundImage: "",
                  _type: "Box",
                  _id: "rnqzul",
                  _name: "Box",
                },
              ];
        return new Promise((resolve) => {
          setTimeout(() => resolve(blocks), 100);
        });
      }}
      getPartialBlocks={async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              header: {
                type: "GlobalBlock",
                name: "Header",
                description: "Header",
              },
              footer: {
                type: "GlobalBlock",
                name: "Footer",
                description: "Footer",
              },
              partial: {
                type: "PartialBlock",
                name: "Partial Name here",
                description: "Partial",
              },
            });
          }, 1000);
        });
      }}
      pageTypes={[{ key: "page", name: "Pages" }]}
      searchPageTypeItems={async (pageTypeKey: string, query: string | string[]) => {
        if (pageTypeKey === "page") {
          const items = [
            { id: "uuid-1", name: "Page 1", slug: "/page-1" },
            { id: "uuid-2", name: "Page 2" },
            { id: "uuid-3", name: "About", slug: "/about" },
            { id: "uuid-4", name: "Contact" },
          ];
          await new Promise((r) => setTimeout(r, 500));
          return items.filter((item) => {
            if (isArray(query)) return query.includes(item.id);
            return item.name.toLowerCase().includes(query.toString().toLowerCase());
          });
        }
        return [];
      }}
    />
  );
}

export default ChaiBuilderDefault;
