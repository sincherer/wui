import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";
import React, { lazy, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import ChaiBuilderDefault from "./Editor.tsx"
import ChaiBuilderCustom from "./EditorCustom.tsx";
import { MicrosoftClarity } from "./__dev/MicrosoftClarity.tsx";
import WebsiteManagement from "./dashboard/WebsiteManagement.tsx";
import WebsiteSetup from "./dashboard/WebsiteSetup.tsx";
import Dashboard from "./dashboard/Dashboard.tsx";
import LoginPage from "./core/pages/LoginPage.tsx" // Import your login page
import SignUpPage from "./core/pages/SignUpPage.tsx"; // Import your sign-up page
import { getCurrentUser } from "./core/lib/auth"; // Import auth utility
import LandingPage from "./core/pages/LandingPage.tsx";
import "./index.css";

// Lazy-loaded components

const Preview = lazy(() => import("./Preview.tsx"));

// AuthGuard Component
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth error:', error);
        setIsAuthenticated(false);
        return Promise.reject(error);
      }
    };

    checkAuth().catch((error) => {
          console.error('Authentication error:', error);
          setIsAuthenticated(false);
          return Promise.reject(error);
        });
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Show a loading spinner while checking auth
  }

  return isAuthenticated ? (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      {children}
    </ErrorBoundary>
  ) : (
    <Navigate to="/login" replace />
  );
};

const router = createBrowserRouter([
  {
    path: "/",

    element: <LandingPage />,
  },
  {
    path: "/wui",
    element: <Navigate to="/" replace />
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/website-management",
    element: (
      <AuthGuard>
        <WebsiteManagement />
      </AuthGuard>
    ),
  },
  {
    path: "/website/:id/setup",
    element: (
      <AuthGuard>
        <WebsiteSetup />
      </AuthGuard>
    ),
  },
  {
    path: "/website/:id/editor",
    element: <ChaiBuilderDefault />,
  },
  {
    path: "/:websiteName/editor/custom",
    element: <ChaiBuilderCustom />,
  },
  {
    path: "/website/:websiteId/:pageName/preview",
    element: <Preview />,
  },
]);

async function enableMocking() {
  if (import.meta.env.MODE !== "development") {
    return;
  }

  // Mocking logic here (if needed)
  return true;
}

  enableMocking().then(() => {
  const root = ReactDOM.createRoot(document.getElementById("root")!);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
      <DevTools />
      {import.meta.env.VITE_CLARITY_ID && (
        <MicrosoftClarity clarityId={import.meta.env.VITE_CLARITY_ID} />
      )}
    </React.StrictMode>
  );
});