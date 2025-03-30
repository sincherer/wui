import { useState, useEffect } from "react";
import { Website, WebsiteFormData } from "./types";
import { Link } from 'react-router-dom';
import { AiOutlineClose } from "react-icons/ai";
import {  getWebsites, createWebsite, deleteWebsite } from '../core/lib/supabase';

const WebsiteManagement = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [formData, setFormData] = useState<WebsiteFormData>({ name: "" });
  const [showModal, setShowModal] = useState(false);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const data = await getWebsites();
      setWebsites(data || []);
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const [, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await createWebsite({ name: formData.name });
      setWebsites([data, ...websites]);
      setFormData({ name: "" });
      setShowModal(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create website';
      setError(errorMessage);
      console.error('Error creating website:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Website Management</h2>
        <p>Manage and add websites here.</p>
      </div>

      {/* Add Website Button */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Add Website
      </button>

      {/* Modal for Adding Websites */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Add New Website</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <AiOutlineClose size={20} />
              </button>
            </div>
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
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Website List */}
      <div className="mt-8">
        <h3 className="text-lg font-medium">Your Websites</h3>
        {websites.length === 0 ? (
          <p className="text-gray-500 mt-2">No websites added yet.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {websites.map((website) => (
              <div
                key={website.id}
                className="bg-white p-4 rounded-lg shadow-md flex items-start justify-between"
              >
                {/* Website Card Content */}
                <div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-4">
                      {/* Placeholder thumbnail */}
                      <span className="text-gray-500 text-xl flex items-center justify-center h-full w-full">
                        {website.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium">{website.name}</h4>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(website.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/website/${website.id}/setup`} // Redirect to Website Setup Page
                    className="text-blue-600 hover:underline"
                  >
                    Go to Setup
                  </Link>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={async () => {
                      try {
                        await deleteWebsite(website.id);
                        setWebsites(websites.filter(w => w.id !== website.id));
                      } catch (error) {
                        console.error('Error deleting website:', error);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteManagement;