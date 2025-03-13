import { auth } from "@/auth";
import React from "react";
import Image from "next/image";
import {
  FaGithub,
  FaCodeBranch,
  FaStar,
  FaCode,
  FaCheckCircle,
  FaCalendarAlt,
  FaUsers,
} from "react-icons/fa";

interface SessionUser {
  accessToken?: string; // Adjust fields as needed
}

/** Minimal type definitions for GitHub's GraphQL response. */
interface GitHubViewer {
  name: string | null;
  login: string;
  avatarUrl: string;
  followers: {
    totalCount: number;
  };
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number;
      weeks: ContributionWeek[];
    };
  };
  repositories: {
    totalCount: number;
    nodes: Array<{ stargazerCount: number }>;
  };
  pullRequests: {
    totalCount: number;
  };
  issues: {
    totalCount: number;
  };
  openPullRequests: {
    totalCount: number;
  };
  openIssues: {
    totalCount: number;
  };
}

interface ContributionDay {
  date: string;
  contributionCount: number;
  color: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface HeatmapProps {
  weeks: ContributionWeek[];
  login: string;
}

const GITHUB_STATS_QUERY = `
  query {
    viewer {
      name
      login
      avatarUrl
      followers {
        totalCount
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
      repositories(first: 100, privacy: PUBLIC, isFork: false) {
        totalCount
        nodes {
          stargazerCount
        }
      }
      pullRequests(first: 100, states: MERGED) {
        totalCount
      }
      issues(first: 100, states: CLOSED) {
        totalCount
      }
      openPullRequests: pullRequests(first: 100, states: OPEN) {
        totalCount
      }
      openIssues: issues(first: 100, states: OPEN) {
        totalCount
      }
    }
  }
`;

/** 
 * Single default export 
 * Main component that fetches data & shows stats 
 */
export default async function DetailedGitHubStats() {
  const session = await auth();
  if (!session?.user) {
    return <p className="text-white">Please sign in with GitHub.</p>;
  }

  // Use the SessionUser interface instead of 'any'
  const token = (session.user as SessionUser)?.accessToken;
  if (!token) {
    return <p className="text-white">No GitHub token found. Please sign in with GitHub.</p>;
  }

  let data;
  try {
    data = await fetchGitHubData(token);
  } catch (err) {
    console.error("Error fetching GitHub data:", err);
    return <p className="text-red-500">Failed to fetch GitHub data.</p>;
  }

  const viewer: GitHubViewer = data.viewer;
  const name = viewer.name || viewer.login;
  const login = viewer.login;
  const avatarUrl = viewer.avatarUrl;

  const totalCommits = viewer.contributionsCollection.contributionCalendar.totalContributions;
  const repoCount = viewer.repositories.totalCount;
  const totalStars = viewer.repositories.nodes.reduce(
    (acc, repo) => acc + repo.stargazerCount,
    0
  );
  const mergedPRs = viewer.pullRequests.totalCount;
  const closedIssues = viewer.issues.totalCount;
  const totalFollowers = viewer.followers.totalCount;
  const openPRs = viewer.openPullRequests.totalCount;
  const openIssues = viewer.openIssues.totalCount;
  const { weeks } = viewer.contributionsCollection.contributionCalendar;

  return (
    <div className="p-6 bg-zinc-900 text-white rounded-lg max-w-6xl mx-auto shadow-md">
      {/* Header: user info */}
      <div className="flex items-center gap-4 mb-6">
        {avatarUrl && (
          <Image
            src={avatarUrl}
            alt={`${name} avatar`}
            width={64}
            height={64}
            className="rounded-full border border-gray-700"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaGithub /> {name}
          </h2>
          <p className="text-zinc-400">{login}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<FaCode size={20} />}
          label="Commits (12 mo.)"
          value={totalCommits}
          href={`https://github.com/${login}`}
        />
        <StatCard
          icon={<FaCodeBranch size={20} />}
          label="Public Repositories"
          value={repoCount}
          href={`https://github.com/${login}?tab=repositories`}
        />
        <StatCard
          icon={<FaStar size={20} />}
          label="Stars"
          value={totalStars}
          href={`https://github.com/${login}?tab=stars`}
        />
        <StatCard
          icon={<FaCheckCircle size={20} />}
          label="Merged PRs"
          value={mergedPRs}
          href={`https://github.com/pulls?q=is%3Apr+author%3A${login}+is%3Amerged`}
        />
        <StatCard
          icon={<FaCheckCircle size={20} />}
          label="Closed Issues"
          value={closedIssues}
          href={`https://github.com/issues?q=is%3Aissue+author%3A${login}+is%3Aclosed`}
        />
        <StatCard
          icon={<FaUsers size={20} />}
          label="Followers"
          value={totalFollowers}
          href={`https://github.com/${login}?tab=followers`}
        />
      </div>

      {/* Heatmap & Recent Contributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-800 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <FaCalendarAlt /> Contribution Heatmap
          </h3>
          <ContributionHeatmap weeks={weeks} login={login} />
        </div>
        <RecentContributions
          login={login}
          openPRs={openPRs}
          openIssues={openIssues}
        />
      </div>
    </div>
  );
}

/** Helper to fetch data from GitHub GraphQL API */
async function fetchGitHubData(token: string) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: GITHUB_STATS_QUERY }),
  });
  if (!res.ok) {
    throw new Error(`GitHub GraphQL request failed: ${res.status}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data;
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-zinc-800 p-4 rounded-lg flex flex-col items-center text-center hover:bg-zinc-700 transition"
    >
      <div className="mb-2">{icon}</div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </a>
  );
}

export function ContributionHeatmap({ weeks, login }: HeatmapProps) {
  const reversedWeeks = weeks.slice(-12).reverse();

  return (
    <div className="overflow-x-auto w-full">
      <div className="flex gap-0.5">
        {reversedWeeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-0.5">
            {week.contributionDays.map((day, dIdx) => {
              const link = `https://github.com/${login}?from=${day.date}&to=${day.date}&tab=overview`;
              return (
                <a
                  key={dIdx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-sm border border-zinc-700 hover:opacity-80 group relative"
                  style={{ backgroundColor: day.color }}
                >
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-md">
                    {day.date} - {day.contributionCount} commits
                  </span>
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentContributions({
  login,
  openPRs,
  openIssues,
}: {
  login: string;
  openPRs: number;
  openIssues: number;
}) {
  if (openPRs === 0 && openIssues === 0) {
    return (
      <div className="bg-zinc-800 p-4 rounded-lg shadow-md flex items-center justify-center">
        <p className="text-gray-300">
          No recent contributions. Start a new PR or issue to get involved!
        </p>
      </div>
    );
  }
  return (
    <div className="bg-zinc-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-3">Recent Contributions</h3>
      <div className="space-y-4">
        <a
          href={`https://github.com/pulls?q=is%3Apr+author%3A${login}+is%3Aopen`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-zinc-700 p-3 rounded hover:bg-zinc-600 transition"
        >
          <p className="text-xl font-bold">{openPRs}</p>
          <p className="text-sm text-gray-400">Open PRs</p>
        </a>
        <a
          href={`https://github.com/issues?q=is%3Aissue+author%3A${login}+is%3Aopen`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-zinc-700 p-3 rounded hover:bg-zinc-600 transition"
        >
          <p className="text-xl font-bold">{openIssues}</p>
          <p className="text-sm text-gray-400">Open Issues</p>
        </a>
      </div>
    </div>
  );
}