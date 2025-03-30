import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase, createWebsite } from "../core/lib/supabase";
import { AiOutlineClose } from "react-icons/ai";

const WebsiteSetup = () => {
  const { id } = useParams<{ id: string }>(); // Extract website ID from URL
  const [activeSection, setActiveSection] = useState("setup"); // State for active section
  const navigate = useNavigate(); // For navigation

  const [websites, setWebsites] = useState([]);
  const [currentWebsite, setCurrentWebsite] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    if (id && websites.length > 0) {
      const website = websites.find((w) => w.id === id);
      setCurrentWebsite(website);
    }
  }, [id, websites]);

  const fetchWebsites = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("websites")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setWebsites(data || []);
    } catch (err) {
      console.error("Error fetching websites:", err);
    }
  };

  // Handle website selection from the dropdown
  const handleWebsiteChange = (selectedId: string) => {
    if (selectedId === "add-new") {
      setShowModal(true); // Open the modal for adding a new website
    } else {
      navigate(`/website/${selectedId}/setup`);
    }
  };

  // Handle modal create Website
  const [formData, setFormData] = useState({ name: "" });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await createWebsite({ name: formData.name });
      setWebsites([data, ...websites]); // Add the new website to the list
      setFormData({ name: "" }); // Reset the form
      setShowModal(false); // Close the modal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create website";
      setError(errorMessage);
      console.error("Error creating website:", err);
    }
  };

  // Define sections for navigation
  const sections = [
    { name: "Setup", key: "setup" },
    { name: "User Management", key: "user-management" },
    { name: "Catalog", key: "catalog" },
    { name: "Settings", key: "settings" },
  ];

  return (
    <div className="flex h-screen">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-10 border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Website Setup</h1>
          {/* Website Switcher Dropdown */}
          <div className="relative">
            <select
              value={id}
              onChange={(e) => handleWebsiteChange(e.target.value)}
              className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {websites.map((website) => (
                <option key={website.id} value={website.id}>
                  {website.name}
                </option>
              ))}
              <option value="add-new">+ Add New Website</option> {/* Add New Website Option */}
            </select>
            {/* Dropdown Arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">

            </div>
          </div>
        </div>
      </header>

      {/* Modal for Adding Websites */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Add New Website</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <AiOutlineClose size={20} />
              </button>
            </div>
            {error && <p className="mb-4 text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Website Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side Navigation */}
      <aside className="mt-16 w-64 border-r border-gray-200 bg-gray-100 p-6">
        <nav>
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.key}>
                <button
                  onClick={() => setActiveSection(section.key)}
                  className={`block w-full rounded-md px-4 py-2 text-sm font-medium ${
                    activeSection === section.key ? "bg-gray-200 text-black" : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {section.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="mt-16 flex-1 overflow-y-auto p-6">
        {activeSection === "setup" && (
          <div>
            <h3 className="mb-4 text-xl font-semibold">Setup</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Site Type</h4>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="ecommerce">E-commerce</option>
                  <option value="blog">Blog</option>
                  <option value="portfolio">Portfolio</option>
                </select>
              </div>
              <div>
                <h4 className="font-medium">Go to Editor</h4>
                <button
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => {
                    // Navigate to the editor page
                    navigate(`/website/${currentWebsite?.id}/editor`);
                  }}
                >
                  Open Editor
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "user-management" && (
          <div>
            <h3 className="mb-4 text-xl font-semibold">User Management</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter email to invite"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Send Invite
              </button>
            </div>
          </div>
        )}

        {activeSection === "catalog" && (
          <div>
            <h3 className="mb-4 text-xl font-semibold">Catalog</h3>
            <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Configure Catalog
            </button>
          </div>
        )}

        {activeSection === "settings" && (
          <div>
            <h3 className="mb-4 text-xl font-semibold">Settings</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <Link to={`/settings/${id}/general`} className="text-blue-600 hover:underline">
                  General
                </Link>
              </li>
              <li>
                <Link to={`/settings/${id}/roles`} className="text-blue-600 hover:underline">
                  Role & Permissions
                </Link>
              </li>
              <li>
                <Link to={`/settings/${id}/business`} className="text-blue-600 hover:underline">
                  Business Info
                </Link>
              </li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};

export default WebsiteSetup;
