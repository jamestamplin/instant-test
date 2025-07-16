"use client";

import React from "react";
import Link from "next/link";

import db from "../../lib/db";

type Story = {
  id: string;
  title: string;
  url?: string;
  text?: string;
  points: number;
  createdAt: number;
  commentCount: number;
  author?: { id: string; username: string; karma: number; createdAt: number; bio?: string };
  votes?: { id: string; createdAt: number }[];
};

function useStories(sortBy: "new" | "top" = "top") {
  const { isLoading, error, data } = db.useQuery({
    stories: {
      $: {
        order: sortBy === "new" ? { createdAt: "desc" } : { points: "desc" },
        limit: 30,
      },
      author: {},
      votes: {},
    },
  });

  return { isLoading, error, stories: data?.stories || [] };
}

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

function useUserVotes(userId: string | null) {
  const { data } = db.useQuery(
    userId ? {
      votes: {
        $: { where: { "user.id": userId } },
        story: {},
      },
    } : {}
  );
  return data?.votes || [];
}

function addVote(storyId: string, userId: string) {
  const voteId = crypto.randomUUID();
  db.transact(
    db.tx.votes[voteId].update({
      createdAt: Date.now(),
    }).link({ story: storyId, user: userId })
  );
}

function removeVote(voteId: string) {
  db.transact(db.tx.votes[voteId].delete());
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
              <Link href="/top" className="hover:text-fuchsia-200 font-bold">top</Link>
              <Link href="/submit" className="hover:text-fuchsia-200">submit</Link>
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

function StoryList({ stories, sortBy }: { stories: Story[], sortBy: "new" | "top" }) {
  const { user } = db.useAuth();
  const userVotes = useUserVotes(user?.id || null);

  const getUserVoteForStory = (storyId: string) => {
    return userVotes.find(vote => vote.story?.id === storyId);
  };

  const handleVote = (storyId: string) => {
    if (!user) return;
    
    const existingVote = getUserVoteForStory(storyId);
    if (existingVote) {
      removeVote(existingVote.id);
    } else {
      addVote(storyId, user.id);
    }
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const timeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  };

  return (
    <div className="space-y-3">
      {stories.map((story, index) => {
        const userVote = getUserVoteForStory(story.id);
        const hasVoted = !!userVote;
        
        return (
          <div key={story.id} className="flex items-start space-x-3">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1">
                {sortBy === "top" ? index + 1 : ""}
              </span>
              <button
                onClick={() => handleVote(story.id)}
                className={`p-1 ${hasVoted ? 'text-fuchsia-600' : 'text-gray-400 hover:text-fuchsia-600'}`}
                title={hasVoted ? "Remove vote" : "Vote"}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline space-x-2">
                <h3 className="text-base font-medium text-gray-900">
                  {story.url ? (
                    <a 
                      href={story.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {story.title}
                    </a>
                  ) : (
                    <Link href={`/story/${story.id}`} className="hover:underline">
                      {story.title}
                    </Link>
                  )}
                </h3>
                {story.url && (
                  <span className="text-sm text-gray-500">
                    ({formatUrl(story.url)})
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {story.points} point{story.points !== 1 ? 's' : ''} by {story.author?.username || 'Unknown'} {timeAgo(story.createdAt)} | {story.commentCount} comment{story.commentCount !== 1 ? 's' : ''}
              </div>
              {story.text && (
                <div className="mt-2 text-sm text-gray-700 line-clamp-3">
                  {story.text}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TopPage() {
  const { user, isLoading: authLoading } = db.useAuth();
  const { isLoading, error, stories } = useStories("top");

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Please log in to view stories.</div>;
  if (isLoading) return <div className="p-8 text-center">Loading stories...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StoryList stories={stories} sortBy="top" />
      </main>
    </div>
  );
}