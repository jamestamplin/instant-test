"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import db from "../../lib/db";
import { id } from "@instantdb/react";

function useProfile() {
  const { user } = db.useAuth();
  if (!user) {
    return { profile: null, isLoading: false, error: null };
  }
  const { data, isLoading, error } = db.useQuery({
    profiles: {
      $: { where: { "user.id": user.id } },
    }
  });
  const profile = data?.profiles?.[0];
  return { profile, isLoading, error };
}

function addStory(title: string, url: string, text: string, authorId: string) {
  const storyId = id();
  db.transact(
    db.tx.stories[storyId].update({
      title,
      url: url || null,
      text: text || null,
      points: 1,
      createdAt: Date.now(),
      commentCount: 0,
    }).link({ author: authorId })
  );
  return storyId;
}

function Header() {
  const { profile } = useProfile();

  return (
    <header className="bg-fuchsia-600 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              The Inference
            </Link>
            <nav className="flex space-x-6">
              <Link href="/" className="hover:text-fuchsia-200">new</Link>
              <Link href="/top" className="hover:text-fuchsia-200">top</Link>
              <Link href="/submit" className="hover:text-fuchsia-200 font-bold">submit</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {profile && (
              <span className="text-sm">
                {profile.username} ({profile.karma} karma)
              </span>
            )}
            <button
              onClick={() => db.auth.signOut()}
              className="text-sm hover:text-fuchsia-200"
            >
              logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function SubmitForm() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"url" | "text">("url");
  const { user } = db.useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsLoading(true);
    try {
      addStory(title, url, text, user.id);
      router.push('/');
    } catch (error) {
      console.error("Error submitting story:", error);
      alert("Error submitting story. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit a Story</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              placeholder="Enter a descriptive title"
            />
            <p className="mt-1 text-sm text-gray-500">
              Please make your title descriptive and engaging
            </p>
          </div>

          <div>
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === "url"
                    ? "border-b-2 border-fuchsia-500 text-fuchsia-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === "text"
                    ? "border-b-2 border-fuchsia-500 text-fuchsia-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Text
              </button>
            </div>

            {activeTab === "url" ? (
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="https://example.com"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Link to an article, research paper, or interesting AI content
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                  Text
                </label>
                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Share your thoughts, ask a question, or start a discussion..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Write a text post to share your insights or ask the community
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Submitting..." : "Submit Story"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Submission Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Focus on AI, machine learning, and related technologies</li>
          <li>• Use descriptive titles that accurately represent the content</li>
          <li>• Check if the story has already been submitted recently</li>
          <li>• For text posts, provide meaningful discussion or questions</li>
          <li>• Be respectful and contribute to constructive discussions</li>
        </ul>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  const { user, isLoading: authLoading } = db.useAuth();

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Please log in to submit stories.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubmitForm />
      </main>
    </div>
  );
}