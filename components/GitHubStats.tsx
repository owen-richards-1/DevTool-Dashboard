"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaStar,
  FaRegStar,
  FaCodeBranch,
  FaSpinner,
  FaSearch,
  FaTrash,
  FaGithub,
} from "react-icons/fa";
import { VscGitPullRequest } from "react-icons/vsc";
import toast, { Toaster } from "react-hot-toast";

interface Repo {
  id: number;
  name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  pull_requests?: number;
}

const STORAGE_KEY = "savedRepos";
const MAX_REPOS = 8;
const SUGGESTED_TOPICS = ["react", "node", "python", "machine-learning", "frontend", "typescript"];
const DEFAULT_SEARCH_QUERY = "stars:>50000";

export default function GitHubStats({ limit = 3, showMore = false }: { limit?: number; showMore?: boolean }) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [savedRepos, setSavedRepos] = useState<Repo[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRepos(DEFAULT_SEARCH_QUERY);
    loadSavedRepos();
  }, []);

  const loadSavedRepos = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSavedRepos(JSON.parse(stored));
    }
  };

  /** Fetch repositories based on search query */
  const fetchRepos = async (query: string) => {
    try {
      const res = await axios.get("https://api.github.com/search/repositories", {
        params: { q: query, sort: "stars", order: "desc", per_page: showMore ? 8 : 6 },
      });
      const enrichedRepos = await Promise.all(
        res.data.items.map(async (repo: Repo) => {
          const pullRequests = await fetchPullRequests(repo.owner.login, repo.name);
          return { ...repo, pull_requests: pullRequests };
        })
      );
      setRepos(enrichedRepos);
    } catch {
      toast.error("Failed to fetch repositories.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPullRequests = async (owner: string, repo: string) => {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls`);
      return response.data.length;
    } catch {
      return 0;
    }
  };

  const toggleSaveRepo = (repo: Repo) => {
    const isSaved = savedRepos.some((r) => r.id === repo.id);
    if (isSaved) {
      const updated = savedRepos.filter((r) => r.id !== repo.id);
      setSavedRepos(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      toast.error(`Removed "${repo.name}" from saved.`);
    } else {
      if (savedRepos.length >= MAX_REPOS) {
        toast.error(`You have reached the limit of ${MAX_REPOS} saved repositories.`);
        return;
      }
      const updated = [...savedRepos, repo];
      setSavedRepos(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      toast.success(`Saved "${repo.name}".`);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-400 to-cyan-400 p-6 rounded-lg shadow-lg text-white">
      <Toaster position="top-right" reverseOrder={false} />    
      {/* Search Bar */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/70 focus:ring-2 focus:ring-cyan-300"
          />
          <button
            onClick={() => fetchRepos(`topic:${searchInput}`)}
            className="bg-indigo-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 transition flex items-center gap-1"
          >
            <FaSearch /> Search
          </button>
        </div>

        {/* Suggested Tags & Sort */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {SUGGESTED_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => fetchRepos(`topic:${topic}`)}
                className="text-sm text-white bg-white/10 px-2 py-1 rounded-md hover:bg-white/20 transition"
              >
                {topic}
              </button>
            ))}
          </div>
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">Sort by:</span>
            <select
              onChange={(e) => fetchRepos(`${searchInput} ${e.target.value}`)}
              className="bg-white/10 text-white px-2 py-1 rounded-md"
            >
              <option value="">Best Match</option>
              <option value="stars">Most Stars</option>
              <option value="forks">Most Forks</option>
            </select>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
            <div className="flex justify-center text-white text-sm mt-3 animate-pulse">
              <FaSpinner className="animate-spin mr-2" /> Fetching results...
              </div>
          )}

        {/* Results for search */}
        {!isLoading && searchInput && (
          <h2 className="text-lg font-semibold text-white mt-3">
          Results for: <span className="text-orange-300">{searchInput}</span>
        </h2>
      )}

      {/* Repo List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {repos.slice(0, limit).map((repo) => {
          const isSaved = savedRepos.some((r) => r.id === repo.id);

          return (
            <div key={repo.id} className="bg-white p-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-8 h-8 rounded-full" />
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-gray-900 hover:text-indigo-500 transition"
                  >
                    {repo.name}
                  </a>
                </div>
                <button onClick={() => toggleSaveRepo(repo)}>
                  {isSaved ? (
                    <FaStar className="text-yellow-500" size={16} />
                  ) : (
                    <FaRegStar className="text-yellow-500 hover:text-yellow-600 transition ml-2" size={16} />
                  )}
                </button>
              </div>

              <p className="text-sm text-gray-700 mt-1">{repo.description}</p>

              <div className="flex items-center justify-between mt-3 text-gray-600 text-sm">
                <span className="flex items-center gap-1"><FaRegStar className="text-yellow-500" /> {repo.stargazers_count}</span>
                <span className="flex items-center gap-1"><FaCodeBranch className="text-indigo-500" /> {repo.forks_count}</span>
                {repo.pull_requests !== undefined && (
                  <span className="flex items-center gap-1"><VscGitPullRequest className="text-green-500" /> {repo.pull_requests}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Get More Repos */}
        {showMore && (
          <button
            onClick={() => fetchRepos(DEFAULT_SEARCH_QUERY)}
            className="col-span-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Load More Repos
          </button>
        )}
      </div>

      {/* ✅ Saved Repositories */}
      {savedRepos.length > 0 && (
        <div className="mt-6 bg-white p-5 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Saved Repositories</h2>

            {/* Clear All Button */}
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to remove all saved repositories?")) {
                  setSavedRepos([]);
                  localStorage.removeItem(STORAGE_KEY);
                  toast.error("All saved repositories removed.");
                }
              }}
              className="text-red-600 text-sm hover:text-red-800 transition"
            >
              Clear All
            </button>
          </div>

          <ul className="space-y-3">
            {savedRepos.map((repo) => (
              <li key={repo.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-8 h-8 rounded-full" />
                <a href={repo.html_url} className="text-gray-900 hover:text-indigo-500 transition">
                  {repo.name}
                </a>
                <button onClick={() => toggleSaveRepo(repo)}>
                  <FaTrash className="text-red-500 hover:text-red-700 transition" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}