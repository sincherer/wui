import { Button } from "../ui/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/shadcn/components/ui/dropdown-menu";
import { Github, Upload, ChevronDown, Globe, Rocket } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

interface DeployButtonProps {
  websiteId: string;
  pages: any[];
}

export const DeployButton = ({ websiteId, pages }: DeployButtonProps) => {
  const [isVercelAuthed, setIsVercelAuthed] = useState(false);
  const [isGithubAuthed, setIsGithubAuthed] = useState(false);
  const [isGithubPagesAuthed, setIsGithubPagesAuthed] = useState(false);
  const [isNetlifyAuthed, setIsNetlifyAuthed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedService, setSelectedService] = useState<'vercel' | 'github' | 'netlify' | 'surge' | null>(null);


  const handleServiceAuth = async (service: string, credentials: Record<string, string>) => {
    try {
      const response = await fetch(`/api/auth/${service}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMap = {
          SURGE_CLI_MISSING: 'Surge CLI not installed - Run: npm install -g surge',
          SURGE_AUTH_FAILED: 'Invalid Surge credentials',
          SURGE_NETWORK_ERROR: 'Cannot connect to Surge servers'
        };
        throw new Error(errorMap[errorData.code] || errorData.details || 'Authentication failed');
      }
      return await response.json();
    } catch (error) {
      console.error(`${service} auth error:`, error);
      throw new Error(error.message.replace('surge', 'Surge').replace('cli', 'CLI'));
    }
  };

  const handleVercelAuth = async () => {
    try {
      const response = await fetch("/api/auth/vercel", {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to get auth URL");
      const { url } = await response.json();
      
      // Open Vercel OAuth window
      const authWindow = window.open(url, "Vercel Auth", "width=800,height=600");
      
      // Listen for auth completion
      window.addEventListener("message", async (event) => {
        if (event.data.type === "vercel-auth-success") {
          setIsVercelAuthed(true);
          authWindow?.close();
          handleVercelDeploy();
        }
      });
    } catch (error) {
      console.error("Vercel auth error:", error);
      alert("Failed to authenticate with Vercel");
    }
  };
 
    

  const handleNetlifyAuth = async () => {
    try {
      const response = await fetch("/api/auth/netlify", {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to get auth URL");
      const { url } = await response.json();
      
      // Open Netlify OAuth window
      const authWindow = window.open(url, "Netlify Auth", "width=800,height=600");
      
      window.addEventListener("message", async (event) => {
        if (event.data.type === "netlify-auth-success") {
          setIsNetlifyAuthed(true);
          authWindow?.close();
          handleNetlifyDeploy();
        }
      });
    } catch (error) {
      console.error("Netlify auth error:", error);
      alert("Failed to authenticate with Netlify");
    }
  };

  const handleVercelDeploy = async () => {
    if (!isVercelAuthed) {
      handleVercelAuth();
      return;
    }

    try {
      const response = await fetch("/api/deploy/vercel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, pages }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to deploy to Vercel");
      const result = await response.json();
      alert(`Successfully deployed to Vercel! URL: ${result.deploymentUrl}`);
    } catch (error) {
      console.error("Vercel deployment error:", error);
      alert("Failed to deploy to Vercel");
    }
  };

  const handleNetlifyDeploy = async () => {
    if (!isNetlifyAuthed) {
      handleNetlifyAuth();
      return;
    }

    try {
      const response = await fetch("/api/deploy/netlify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, pages }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to deploy to Netlify");
      const result = await response.json();
      alert(`Successfully deployed to Netlify! Site URL: ${result.siteUrl}`);
    } catch (error) {
      console.error("Netlify deployment error:", error);
      alert("Failed to deploy to Netlify");
    }
  };

  const handleGithubPagesDeployment = async () => {
    if (!isGithubPagesAuthed) {
      try {
        const response = await fetch("/api/auth/github-pages", {
          method: "GET",
          credentials: "include",
        });
        
        if (!response.ok) throw new Error("Failed to authenticate with GitHub Pages");
        setIsGithubPagesAuthed(true);
      } catch (error) {
        console.error("GitHub Pages auth error:", error);
        alert("Failed to authenticate with GitHub Pages");
        return;
      }
    }

    try {
      const response = await fetch("/api/deploy/github-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, pages }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to deploy to GitHub Pages");
      const result = await response.json();
      alert(`Successfully deployed to GitHub Pages! Site URL: ${result.pageUrl}`);
    } catch (error) {
      console.error("GitHub Pages deployment error:", error);
      alert("Failed to deploy to GitHub Pages");
    }
  };

  const handleSurgeDeploy = async () => {
    try {
      // Validate required data before making the request
      if (!websiteId) {
        throw new Error('Website ID is required');
      }
      if (!pages || Object.keys(pages).length === 0) {
        throw new Error('No pages to deploy');
      }
  
      // First, check if the API is available
      const API_URL = 'http://localhost:5174';
      const response = await fetch(`${API_URL}/api/deploy/surge`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ 
          websiteId, 
          pages,
          config: {
            domain: `${websiteId}.surge.sh`,
            project: websiteId
          }
        }),
        credentials: "include",
      });
  
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Surge Deployment Response:", {
          endpoint: `${import.meta.env.VITE_API_URL}/api/auth/surge`,
          status: response.status,
          statusText: response.statusText,
          body: errorText || "Empty response"
        });

        // Handle automatic account creation response
        if (response.status === 201) {
          const result = JSON.parse(errorText);
          localStorage.setItem('surge_token', result.token);
          return { success: true, message: 'New account created' };
        }

        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.surgeUrl) {
        throw new Error("Invalid deployment response: Missing site URL");
      }
  
      alert(`Successfully deployed to Surge! Site URL: ${result.surgeUrl}`);
      alert(`Surge authentication successful! ${result.status === 'SURGE_ACCOUNT_CREATED' ? 'New account created' : ''}`);
    } catch (error) {
      console.error("Surge deployment error:", error);
      let userMessage = 'Deployment failed';
      let details = '';
      
      if (error.response?.data?.error) {
        userMessage = error.response.data.error;
        details = error.response.data.details || '';
      } else if (error.message.includes('Failed to fetch')) {
        userMessage = 'Connection to server failed';
        details = 'Check if backend service is running';
      }

      alert(`Surge Deployment Error: ${userMessage}\n${details}`);
      alert(`Failed to deploy to Surge: ${error.message}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Deploy
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {showAuthModal && selectedService && (
          <AuthModal
            service={selectedService}
            websiteId={websiteId}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={async (credentials) => {
              try {
                await handleServiceAuth(selectedService, credentials);
                setIsVercelAuthed(selectedService === 'vercel');
                setIsGithubAuthed(selectedService === 'github');
                setIsNetlifyAuthed(selectedService === 'netlify');
                if(selectedService === 'surge') handleSurgeDeploy();
              } catch (error) {
                alert(`Failed to authenticate with ${selectedService}`);
              }
            }}
            />
        )}
        <DropdownMenuItem onClick={handleGithubPagesDeployment}>
          <Globe className="mr-2 h-4 w-4" />
          Deploy to GitHub Pages (Free)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
            setSelectedService('surge');
            setShowAuthModal(true);
          }}>
          <Rocket className="mr-2 h-4 w-4" />
          Deploy to Surge.sh (Free)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
            setSelectedService('vercel');
            setShowAuthModal(true);
          }}>
          <img src="/vercel-icon.svg" alt="Vercel" className="mr-2 h-4 w-4" />
          Deploy to Vercel {isVercelAuthed && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
            setSelectedService('github');
            setShowAuthModal(true);
          }}>
          <Github className="mr-2 h-4 w-4" />
          Deploy to GitHub {isGithubAuthed && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
            setSelectedService('netlify');
            setShowAuthModal(true);
          }}>
          <img src="/netlify-icon.svg" alt="Netlify" className="mr-2 h-4 w-4" />
          Deploy to Netlify {isNetlifyAuthed && "✓"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Remove unused GitHub auth handler