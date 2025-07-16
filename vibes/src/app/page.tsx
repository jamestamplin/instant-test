"use client";

import React, { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import Link from "next/link";

import db from "../lib/db";

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

function randomUsername() {
  const adjectives = ["Swift", "Quantum", "Neural", "Digital", "Cyber", "Virtual", "Smart", "Deep", "Meta", "Nano"];
  const nouns = ["Thinker", "Analyst", "Coder", "Hacker", "Bot", "Mind", "Brain", "Logic", "Node", "Agent"];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
  return `${randomAdjective}${randomNoun}${randomSuffix}`;
}

async function createProfile(userId: string) {
  await db.transact(
    db.tx.profiles[userId].update({
      username: randomUsername(),
      bio: "",
      karma: 0,
      createdAt: Date.now(),
    }).link({ user: userId })
  );
}


function addVote(storyId: string, userId: string) {
  db.transact(
    db.tx.votes[id()].update({
      createdAt: Date.now(),
    }).link({ story: storyId, user: userId })
  );
}

function removeVote(voteId: string) {
  db.transact(db.tx.votes[voteId].delete());
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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, error } = db.useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Auth error: {error.message}</div>;
  if (!user) return <Login />;

  return <>{children}</>;
}

function Login() {
  const [sentEmail, setSentEmail] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-fuchsia-600 flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to The Inference
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            The premier destination for AI news and discussion
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-fuchsia-400 rounded-full"></div>
              <span>Curated AI content</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-fuchsia-400 rounded-full"></div>
              <span>Expert discussions</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-fuchsia-400 rounded-full"></div>
              <span>Breaking AI news</span>
            </div>
          </div>
        </div>
        {!sentEmail ? (
          <EmailStep onSendEmail={setSentEmail} />
        ) : (
          <CodeStep sentEmail={sentEmail} />
        )}
        <div className="text-center text-xs text-gray-500">
          Join thousands of AI enthusiasts and researchers
        </div>
      </div>
    </div>
  );
}

function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      onSendEmail(email);
    } catch (err: unknown) {
      alert("Error: " + (err as { body?: { message?: string } }).body?.message);
      onSendEmail("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md shadow-sm -space-y-px">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 focus:z-10 sm:text-sm"
          placeholder="Enter your email address"
          autoFocus
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send Magic Link"}
        </button>
      </div>
    </form>
  );
}

function CodeStep({ sentEmail }: { sentEmail: string }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });
    } catch (err: unknown) {
      alert("Error: " + (err as { body?: { message?: string } }).body?.message);
      setCode("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-600">
          We sent a verification code to <strong>{sentEmail}</strong>
        </p>
      </div>
      <div className="rounded-md shadow-sm -space-y-px">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 focus:z-10 sm:text-sm"
          placeholder="Enter verification code"
          autoFocus
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </button>
      </div>
    </form>
  );
}

function EnsureProfile({ children }: { children: React.ReactNode }) {
  const { user } = db.useAuth();
  const { isLoading, profile, error } = useProfile();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!isLoading && !profile && user) {
      createProfile(user.id);
      setShowWelcome(true);
    }
  }, [user, isLoading, profile]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Setting up your profile...</div>;
  if (error) return <div className="p-4 text-red-500">Profile error: {error.message}</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center">Creating your profile...</div>;

  if (showWelcome) {
    return <WelcomeExperience onComplete={() => setShowWelcome(false)} profile={profile} />;
  }

  return <>{children}</>;
}

function WelcomeExperience({ onComplete, profile }: { onComplete: () => void, profile: { username: string } }) {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: "Welcome to The Inference! 🎉",
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-fuchsia-600 flex items-center justify-center">
            <span className="text-2xl text-white font-bold">{profile.username[0]}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Hello, {profile.username}!</h2>
            <p className="text-gray-600">Your AI-focused username has been generated. You can change it later in your profile.</p>
          </div>
        </div>
      )
    },
    {
      title: "Discover AI Content",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-fuchsia-100 rounded-full flex items-center justify-center">
                <span className="text-fuchsia-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Browse Stories</h3>
                <p className="text-sm text-gray-600">Explore curated AI news, research papers, and discussions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-fuchsia-100 rounded-full flex items-center justify-center">
                <span className="text-fuchsia-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Vote & Engage</h3>
                <p className="text-sm text-gray-600">Upvote interesting content and join discussions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-fuchsia-100 rounded-full flex items-center justify-center">
                <span className="text-fuchsia-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Share Content</h3>
                <p className="text-sm text-gray-600">Submit your own AI-related findings and insights</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Ready to explore!",
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">You&apos;re all set!</h2>
            <p className="text-gray-600">Start exploring the latest in AI and machine learning</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= step ? 'bg-fuchsia-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">{step + 1} of {steps.length}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{steps[step].title}</h1>
        </div>

        <div className="mb-8">
          {steps[step].content}
        </div>

        <div className="flex justify-between">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                onComplete();
              }
            }}
            className="px-6 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700"
          >
            {step < steps.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
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

function HomePage() {
  const { isLoading, error, stories } = useStories("new");

  if (isLoading) return <div className="p-8 text-center">Loading stories...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StoryList stories={stories} sortBy="new" />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <EnsureProfile>
        <HomePage />
      </EnsureProfile>
    </AuthGate>
  );
}