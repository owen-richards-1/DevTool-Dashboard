"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  FaStar,
  FaRegStar,
  FaCodeBranch,
  FaSpinner,
  FaSearch,
  FaSyncAlt,
} from "react-icons/fa";
import { VscGitPullRequest } from "react-icons/vsc";
import toast, { Toaster } from "react-hot-toast";
import { GITHUB_STATS_QUERY } from "@/queries/GITHUB_STATS_QUERY";

/** Repo interfaces */
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

interface RepoWithAnimation extends Repo {
  isNew?: boolean;
}

/** For reading a GitHub token from session.user */
interface SessionUser {
  accessToken?: string;
}

/** Some constants */
const SUGGESTED_TOPICS = [
  "react",
  "node",
  "python",
  "machine-learning",
  "frontend",
  "typescript",
];
const DEFAULT_SEARCH_QUERY = "stars:>50000";

export default function GitHubRepos({ limit = 6 }: { limit?: number }) {
  const { data: session } = useSession();

  // -------------------- State --------------------
  const [repos, setRepos] = useState<RepoWithAnimation[]>([]);
  const [starredRepos, setStarredRepos] = useState<Repo[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRepoId, setLoadingRepoId] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState<"bestMatch" | "stars" | "forks">("stars");

  const perPage = limit;
  const pagesPerChunk = 5;

  // Get GitHub API token from session (assumes it's stored as `accessToken`)
  const token = (session?.user as SessionUser)?.accessToken;

  // -------------------- Hooks --------------------
  /**
   * Reusable function to fetch repos (default or search).
   * We’ll call this from fetchDefaultRepos() or handleSearch(), etc.
   */
  const fetchRepos = useCallback(
    async (query: string, pageNumber: number) => {
      setIsLoading(true);
      try {
        // Sort option (ignore if "bestMatch")
        const finalSort = sortOption === "bestMatch" ? undefined : sortOption;

        // Query parameters
        const params: Record<string, string | number> = {
          q: query,
          page: pageNumber,
          per_page: perPage,
          order: "desc",
        };
        if (finalSort) {
          params.sort = finalSort;
        }

        // Call GitHub Search API
        const res = await axios.get("https://api.github.com/search/repositories", { params });
        setTotalCount(res.data.total_count || 0);

        // For each repo, fetch open pull requests
        const enrichedRepos: RepoWithAnimation[] = await Promise.all(
          res.data.items.map(async (repo: Repo) => {
            const pullRequests = await fetchPullRequests(repo.owner.login, repo.name);
            return { ...repo, pull_requests: pullRequests };
          })
        );

        setRepos(enrichedRepos);
        setPage(pageNumber);
      } catch (error) {
        console.error("Error fetching repositories:", error);
        toast.error("Failed to fetch repositories.");
      } finally {
        setIsLoading(false);
      }
    },
    [perPage, sortOption]
  );

  /**
   * Default random repos (stars:>50000).
   * We do a random page fetch (1..5) to discover interesting repos.
   */
  const fetchDefaultRepos = useCallback(() => {
    setIsSearchMode(false);
    const randomPage = Math.floor(Math.random() * 5) + 1;
    fetchRepos(DEFAULT_SEARCH_QUERY, randomPage);
  }, [fetchRepos]);

  /** 
   * Pull request count. 
   * We call GET /repos/{owner}/{repo}/pulls, then return the length.
   */
  const fetchPullRequests = async (owner: string, repo: string) => {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls`);
      return response.data.length;
    } catch {
      return 0;
    }
  };

  /**
   * Fetch the user’s starred repos (needs an OAuth token).
   * We’ll store them in starredRepos[] so we know which repos are starred.
   */
  const fetchStarredRepos = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("https://api.github.com/user/starred", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStarredRepos(res.data);
    } catch (error) {
      console.error("Error fetching starred repos:", error);
      toast.error("Failed to fetch starred repositories.");
    }
  }, [token]);

  /**
   * On mount: fetch random "default" repos. If we have a token, fetch user’s starred repos too.
   */
  useEffect(() => {
    fetchDefaultRepos();
    if (token) {
      fetchStarredRepos();
    }
  }, [fetchDefaultRepos, fetchStarredRepos, token]);

  /**
   * We animate newly added repos by setting `repo.isNew = true`. 
   * This effect removes the animation after 1 second.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setRepos((prev) => prev.map((r) => (r.isNew ? { ...r, isNew: false } : r)));
    }, 1000);
    return () => clearTimeout(timer);
  }, [repos]);

  // -------------------- Helpers --------------------
  /** Check if a repo is in our starredRepos[] list */
  const isRepoStarred = (repo: Repo): boolean => {
    return starredRepos.some(
      (r) => r.id === repo.id && r.owner.login.toLowerCase() === repo.owner.login.toLowerCase()
    );
  };

  /**
   * Fetch a single replacement repo so that if we star an item from the "suggested" 
   * list, we fill it back up with a new interesting one.
   */
  const fetchReplacementRepo = async () => {
    try {
      const query = isSearchMode ? `topic:${searchInput}` : DEFAULT_SEARCH_QUERY;
      const finalSort = sortOption === "bestMatch" ? undefined : sortOption;

      const params: Record<string, string | number> = {
        q: query,
        page,
        per_page: perPage,
        order: "desc",
      };
      if (finalSort) params.sort = finalSort;

      const res = await axios.get("https://api.github.com/search/repositories", { params });
      const newRepos: Repo[] = res.data.items;

      // find a new repo not already in "repos" or "starredRepos"
      const replacement = newRepos.find(
        (r) => !repos.some((existing) => existing.id === r.id) &&
               !starredRepos.some((starred) => starred.id === r.id)
      );
      if (replacement) {
        const pullRequests = await fetchPullRequests(replacement.owner.login, replacement.name);
        const replacementWithAnim: RepoWithAnimation = {
          ...replacement,
          pull_requests: pullRequests,
          isNew: true,
        };
        setRepos((prev) => [...prev, replacementWithAnim]);
      }
    } catch (error) {
      console.error("Error fetching replacement repo:", error);
    }
  };

  // -------------------- Star/Unstar --------------------
  async function handleStarRepo(owner: string, repo: string, repoId: string, repoData: Repo) {
    if (!token) {
      toast.error("GitHub token not available.");
      return;
    }
    setLoadingRepoId(repoId);
    try {
      const url = `https://api.github.com/user/starred/${owner}/${repo}`;
      await axios.put(url, null, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      toast.success(`Starred ${repo} successfully!`);

      // remove from "suggested" and add to "starred"
      setRepos((prev) => prev.filter((r) => r.id.toString() !== repoId));
      setStarredRepos((prev) => [...prev, repoData]);

      // fetch a replacement so the suggested list remains full
      fetchReplacementRepo();
    } catch (error) {
      console.error("Error starring repo:", error);
      toast.error("Failed to star the repository.");
    } finally {
      setLoadingRepoId(null);
    }
  }

  async function handleUnstarRepo(owner: string, repo: string, repoId: string) {
    if (!token) {
      toast.error("GitHub token not available.");
      return;
    }
    setLoadingRepoId(repoId);
    try {
      const url = `https://api.github.com/user/starred/${owner}/${repo}`;
      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      toast.success(`Unstarred ${repo} successfully!`);
      // remove from starred
      setStarredRepos((prev) => prev.filter((r) => r.id.toString() !== repoId));
      // you could optionally fetch a replacement for the Starred list
    } catch (error) {
      console.error("Error unstarring repo:", error);
      toast.error("Failed to unstar the repository.");
    } finally {
      setLoadingRepoId(null);
    }
  }

  // -------------------- Search + UI actions --------------------
  const handleSearch = () => {
    if (!searchInput.trim()) {
      toast.error("Please enter a topic to search.");
      return;
    }
    setIsSearchMode(true);
    fetchRepos(`topic:${searchInput}`, 1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    fetchDefaultRepos();
  };

  const handleSuggestMore = () => {
    fetchDefaultRepos();
  };

  const handlePageClick = (pageNumber: number) => {
    if (isSearchMode) {
      fetchRepos(`topic:${searchInput}`, pageNumber);
    }
    setPage(pageNumber);
  };

  const handleSortChange = (newSort: "bestMatch" | "stars" | "forks") => {
    setSortOption(newSort);
    // Refresh data from page=1
    if (isSearchMode) {
      fetchRepos(`topic:${searchInput}`, 1);
    } else {
      setIsSearchMode(false);
      fetchRepos(DEFAULT_SEARCH_QUERY, 1);
    }
  };

  const setSearchModeAndSearchTopic = (topic: string) => {
    setSearchInput(topic);
    setIsSearchMode(true);
    fetchRepos(`topic:${topic}`, 1);
  };

  // Pagination calculations
  const totalPages = isSearchMode ? Math.ceil(totalCount / perPage) : 0;
  const currentChunk = Math.floor((page - 1) / pagesPerChunk);
  const startPage = currentChunk * pagesPerChunk + 1;
  const endPage = Math.min(startPage + pagesPerChunk - 1, totalPages);

  // -------------------- Render --------------------
  return (
    <div className="bg-gradient-to-tr from-zinc-600 to-zinc-900 p-6 rounded-lg shadow-lg text-white">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Search & Clear Bar */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Search GitHub repositories..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/70 focus:ring-2 focus:ring-cyan-300"
        />
        <button
          onClick={handleSearch}
          className="bg-indigo-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 transition flex items-center gap-1"
        >
          <FaSearch /> Search
        </button>
        {isSearchMode && (
          <button
            onClick={handleClearSearch}
            className="bg-red-600 text-white px-3 py-2 text-sm rounded-md hover:bg-red-700 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Suggested Topics */}
      <div className="flex items-center gap-2 mb-3">
        {SUGGESTED_TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => setSearchModeAndSearchTopic(topic)}
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
          value={sortOption}
          onChange={(e) =>
            handleSortChange(e.target.value as "bestMatch" | "stars" | "forks")
          }
          className="bg-white/10 text-white px-2 py-1 rounded-md"
        >
          <option value="bestMatch">Best Match</option>
          <option value="stars">Most Stars</option>
          <option value="forks">Most Forks</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex justify-center text-white text-sm mt-3 animate-pulse">
          <FaSpinner className="animate-spin mr-2" /> Fetching results...
        </div>
      )}

      {/* Show search results info or 'no results' */}
      {!isLoading && isSearchMode && (
        totalCount > 0 ? (
          <h2 className="text-lg font-semibold text-white mt-3">
            {totalCount} results found for: <span className="text-orange-300">{searchInput}</span>
          </h2>
        ) : (
          <h2 className="text-lg font-semibold text-white mt-3">
            No results found for: <span className="text-orange-300">{searchInput}</span>
          </h2>
        )
      )}

      {/* Repo List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {!isLoading &&
          repos.map((repo) => (
            <div
              key={repo.id}
              className={`bg-white p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
                repo.isNew ? "animate-fadeIn" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src={repo.owner.avatar_url}
                    alt={repo.owner.login}
                    className="w-8 h-8 rounded-full"
                    width={32}
                    height={32}
                  />
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-gray-900 hover:text-indigo-500 transition"
                  >
                    {repo.name}
                  </a>
                </div>
                <div className="flex gap-2">
                  {/* Star/Unstar button */}
                  <button
                    onClick={() =>
                      isRepoStarred(repo)
                        ? handleUnstarRepo(repo.owner.login, repo.name, repo.id.toString())
                        : handleStarRepo(repo.owner.login, repo.name, repo.id.toString(), repo)
                    }
                    className="cursor-pointer p-1"
                    title={
                      isRepoStarred(repo)
                        ? "Unstar this repo on GitHub"
                        : "Star this repo on GitHub"
                    }
                  >
                    {loadingRepoId === repo.id.toString() ? (
                      <FaSpinner size={20} className="animate-spin text-yellow-500" />
                    ) : isRepoStarred(repo) ? (
                      <FaStar size={20} className="text-yellow-500" />
                    ) : (
                      <FaRegStar size={20} className="text-yellow-500" />
                    )}
                  </button>
                  {/* Fork button */}
                  <a
                    href={`https://github.com/${repo.owner.login}/${repo.name}/fork`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer p-1"
                    title="Fork this repo on GitHub"
                  >
                    <FaCodeBranch size={20} className="text-blue-500 hover:text-blue-600 transition" />
                  </a>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-1">{repo.description}</p>
              <div className="flex items-center justify-between mt-3 text-gray-600 text-sm">
                <span className="flex items-center gap-1">
                  <FaRegStar className="text-yellow-500" /> {repo.stargazers_count}
                </span>
                <span className="flex items-center gap-1">
                  <FaCodeBranch className="text-indigo-500" /> {repo.forks_count}
                </span>
                {repo.pull_requests !== undefined && (
                  <span className="flex items-center gap-1">
                    <VscGitPullRequest className="text-green-500" /> {repo.pull_requests}
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Suggest More (Default Mode Only) */}
      {!isLoading && !isSearchMode && repos.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSuggestMore}
            className="bg-green-600 text-white px-4 py-2 text-sm rounded-md hover:bg-green-700 transition flex items-center gap-2"
          >
            <FaSyncAlt />
            Suggest More
          </button>
        </div>
      )}

      {/* Pagination (Search Mode) */}
      {isSearchMode && !isLoading && totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {startPage > 1 && (
            <button
              className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
              onClick={() => handlePageClick(startPage - 1)}
            >
              &lt;
            </button>
          )}
          {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
            const pageNum = startPage + i;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`px-3 py-1 rounded-md ${
                  pageNum === page
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          {endPage < totalPages && (
            <button
              className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
              onClick={() => handlePageClick(endPage + 1)}
            >
              &gt;
            </button>
          )}
        </div>
      )}

      {/* Starred Repos */}
      {starredRepos.length > 0 && (
        <div className="mt-6 bg-white p-5 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Starred Repositories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {starredRepos.map((repo: Repo) => (
              <div
                key={repo.id}
                className="bg-white p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      className="w-8 h-8 rounded-full"
                      width={32}
                      height={32}
                    />
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-gray-900 hover:text-indigo-500 transition"
                    >
                      {repo.name}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        isRepoStarred(repo)
                          ? handleUnstarRepo(repo.owner.login, repo.name, repo.id.toString())
                          : handleStarRepo(repo.owner.login, repo.name, repo.id.toString(), repo)
                      }
                      className="cursor-pointer p-1"
                      title={
                        isRepoStarred(repo)
                          ? "Unstar this repo on GitHub"
                          : "Star this repo on GitHub"
                      }
                    >
                      {loadingRepoId === repo.id.toString() ? (
                        <FaSpinner size={20} className="animate-spin text-yellow-500" />
                      ) : isRepoStarred(repo) ? (
                        <FaStar size={20} className="text-yellow-500" />
                      ) : (
                        <FaRegStar size={20} className="text-yellow-500" />
                      )}
                    </button>
                    <a
                      href={`https://github.com/${repo.owner.login}/${repo.name}/fork`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer p-1"
                      title="Fork this repo on GitHub"
                    >
                      <FaCodeBranch size={20} className="text-blue-500 hover:text-blue-600 transition" />
                    </a>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1">{repo.description}</p>
                <div className="flex items-center justify-between mt-3 text-gray-600 text-sm">
                  <span className="flex items-center gap-1">
                    <FaRegStar className="text-yellow-500" /> {repo.stargazers_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCodeBranch className="text-indigo-500" /> {repo.forks_count}
                  </span>
                  {repo.pull_requests !== undefined && (
                    <span className="flex items-center gap-1">
                      <VscGitPullRequest className="text-green-500" /> {repo.pull_requests}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Optional utility for GitHub GraphQL stats. */
export async function fetchGitHubData(token: string) {
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