import { useState, useEffect } from "react";
import { supabase } from "../core/lib/supabase" // Adjust the path if necessary
import UserManagement from "./UserManagement";
import WebsiteManagement from "./WebsiteManagement";
import DomainSetup from "./DomainSetup";
import ProductManagement from "./ProductManagement";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("userManagement");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [_profileExists, setProfileExists] = useState(false); // Suppress unused warning

  // State for profile details
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
      const checkProfile = async () => {
        try {
          // Get the current user's UUID
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
            throw new Error("User not found");
          }
    
          // Check if the user has a profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(); // Use maybeSingle to avoid errors
    
          if (profileError) {
            throw new Error(profileError.message || "An error occurred while fetching profile.");
          }
    
          // Set profile existence status
          setProfileExists(!!profileData);
    
          // Show modal if no profile exists
          if (!profileData) {
            setShowProfileModal(true);
          }
        } catch (err: any) {
          console.error("Error checking profile:", err.message);
        }
      };
    
      checkProfile();
    }, []);

  const handleProfileSubmit = async () => {
    try {
      // Get the current user's UUID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("User not found");

      // Insert or update the profile data
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id, // UUID from auth.users
            full_name: fullName,
            avatar_url: avatarUrl,
            role,
            settings: {}, // Default empty JSON object
            updated_at: new Date().toISOString(), // Update timestamp
          },
          { onConflict: "id" } // Ensure no duplicate entries
        )
        .select(); // Optionally select the inserted/updated data

      if (error) throw error;

      console.log("Profile saved successfully:", data);

      // Close the modal and mark profile as completed
      setShowProfileModal(false);
      setProfileExists(true);
    } catch (err: any) {
      console.error("Error during profile submission:", err.message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Website Dashboard</h1>

      {/* Segmented Button Group */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 gap-6 md:flex-row">
        <div className="inline-flex h-9 w-full items-baseline justify-start rounded-lg bg-gray-100 p-1 sm:w-auto">
          <button
            onClick={() => setActiveTab("userManagement")}
            className={`group inline-flex items-center justify-center whitespace-nowrap py-2 align-middle font-semibold transition-all duration-300 ease-in-out disabled:cursor-not-allowed min-w-[32px] gap-1.5 text-xs h-7 text-slate-950 rounded-md px-3 ${
              activeTab === "userManagement"
                ? "bg-white shadow"
                : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow"
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("websiteManagement")}
            className={`group inline-flex items-center justify-center whitespace-nowrap py-2 align-middle font-semibold transition-all duration-300 ease-in-out disabled:cursor-not-allowed min-w-[32px] gap-1.5 text-xs h-7 text-slate-950 rounded-md px-3 ${
              activeTab === "websiteManagement"
                ? "bg-white shadow"
                : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow"
            }`}
          >
            Website Management
          </button>
          <button
            onClick={() => setActiveTab("domainSetup")}
            className={`group inline-flex items-center justify-center whitespace-nowrap py-2 align-middle font-semibold transition-all duration-300 ease-in-out disabled:cursor-not-allowed min-w-[32px] gap-1.5 text-xs h-7 text-slate-950 rounded-md px-3 ${
              activeTab === "domainSetup"
                ? "bg-white shadow"
                : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow"
            }`}
          >
            Domain Setup
          </button>
          <button
            onClick={() => setActiveTab("productManagement")}
            className={`group inline-flex items-center justify-center whitespace-nowrap py-2 align-middle font-semibold transition-all duration-300 ease-in-out disabled:cursor-not-allowed min-w-[32px] gap-1.5 text-xs h-7 text-slate-950 rounded-md px-3 ${
              activeTab === "productManagement"
                ? "bg-white shadow"
                : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow"
            }`}
          >
            Product Management
          </button>
        </div>
      </div>

      {/* Profile Setup Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Complete Your Profile</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="full-name"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="avatar-url" className="block text-sm font-medium text-gray-700">
                  Avatar URL (optional)
                </label>
                <input
                  id="avatar-url"
                  type="url"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleProfileSubmit}
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Content Display */}
      <div>
        {activeTab === "userManagement" && <UserManagement />}
        {activeTab === "websiteManagement" && <WebsiteManagement />}
        {activeTab === "domainSetup" && <DomainSetup />}
        {activeTab === "productManagement" && <ProductManagement />}
      </div>
    </div>
  );
};

export default Dashboard;