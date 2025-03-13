"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import axios from "axios";
import {
  FaRegStar,
  FaSearch,
  FaTrash,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";

/** Article interface (from your existing code) */
interface Article {
  id: number;
  title: string;
  url: string;
  cover_image: string | null;
  published_at: string;
  positive_reactions_count: number;
  comments_count: number;
  tag_list: string[];
  reading_time_minutes: number;
  user: {
    name: string;
    profile_image: string;
  };
}

/** Local Storage key */
const STORAGE_KEY_SAVED = "savedDevToArticles";

/** Quick topic suggestions for the user */
const TOPIC_SUGGESTIONS = ["ai", "databases", "react", "node", "tailwind"];

export default function DevToBlogs({
  limit = 3,
}: {
  limit?: number;
  showMore?: boolean;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("reactions");

  // Distinguish between "Default Mode" (discovery) and "Search Mode"
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // For pagination in Search Mode
  // Dev.to doesn't provide total_count or has_more,
  // so we guess "hasMore" if we get exactly "limit" articles.
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // If we get fewer than limit => no more pages

  // We limit max page to 50 (avoid endless requests)
  const maxAllowedPages = 50;
  const pagesPerChunk = 5;

  // A place to store current "searched topic"
  // so we can show "Search results for: XYZ"
  const [searchTopic, setSearchTopic] = useState("");

  const fetchArticles = useCallback(
    async (keyword: string, pageNumber: number) => {
      setIsLoading(true);
      setError("");
  
      try {
        const perPage = limit; // use the user-defined limit
        let url = `https://dev.to/api/articles?per_page=${perPage}&page=${pageNumber}`;
  
        // If a keyword is provided => &tag=...
        if (keyword.trim()) {
          url += `&tag=${keyword.toLowerCase()}`;
        }
  
        // Fetch
        const res = await axios.get<Article[]>(url);
        let fetched = res.data;
  
        // If we got fewer than "limit" => no more pages
        setHasMore(fetched.length === perPage);
  
        // Store the "searched topic" for the heading
        setSearchTopic(keyword);
        setPage(pageNumber);
  
        // Client-side sorting
        fetched = sortClientSide(fetched, sortOption);
  
        setArticles(fetched);
        setError("");
      } catch (err) {
        console.error("Error fetching Dev.to articles:", err);
        setError("Failed to fetch articles. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [limit, sortOption] // Dependencies that affect this function
  );

const fetchDefaultArticles = useCallback(() => {
  setIsSearchMode(false);
  const randomPage = Math.floor(Math.random() * 5) + 1;
  fetchArticles("", randomPage);
}, [fetchArticles]); // Now safe since fetchArticles is memoized

  useEffect(() => {
    // Load saved articles
    const storedSaved = localStorage.getItem(STORAGE_KEY_SAVED);
    if (storedSaved) {
      setSavedArticles(JSON.parse(storedSaved));
    }
  
    // Fetch discovery articles
    fetchDefaultArticles();
  }, [fetchDefaultArticles]);

  // Whenever savedArticles changes, sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedArticles));
  }, [savedArticles]);

  /** Sort articles on the client side */
  function sortClientSide(data: Article[], param: string) {
    return [...data].sort((a, b) => {
      switch (param) {
        case "reactions":
          return b.positive_reactions_count - a.positive_reactions_count;
        case "published_at":
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        case "comments_count":
          return b.comments_count - a.comments_count;
        default:
          return 0;
      }
    });
  }

  /** User clicks "Search" => switch to Search Mode, page=1 */
  const handleSearch = () => {
    if (!searchInput.trim()) {
      toast.error("Please enter a topic to search.");
      return;
    }
    setIsSearchMode(true);
    fetchArticles(searchInput, 1);
  };

  /** Clear => revert to default mode */
  const handleClearSearch = () => {
    setSearchInput("");
    fetchDefaultArticles();
  };

  /** "Suggest More" => random page fetch, default mode */
  const handleSuggestMore = () => {
    fetchDefaultArticles();
  };

  /** Sort changed => re-fetch the same mode (search or default) with page=1 */
  const handleSortChange = (newSort: string) => {
    setSortOption(newSort);
    if (isSearchMode) {
      // re-fetch with current search topic, page=1
      fetchArticles(searchTopic, 1);
    } else {
      // default mode => page= random or 1?
      // we'll do page=1 for consistency, or random again
      fetchArticles("", 1);
    }
  };

  /** Suggested topic => search mode, page=1 */
  const handleSuggestionClick = (topic: string) => {
    setSearchInput(topic);
    setIsSearchMode(true);
    fetchArticles(topic, 1);
  };

  /** Toggle save/unsave article */
  const toggleSaveArticle = (article: Article) => {
    const isSaved = savedArticles.some((a) => a.id === article.id);
    if (isSaved) {
      setSavedArticles(savedArticles.filter((a) => a.id !== article.id));
      toast.error("Removed from saved.");
    } else {
      setSavedArticles([...savedArticles, article]);
      toast.success("Saved article.");
    }
  };

  /** Clear all saved articles */
  const clearAllSavedArticles = () => {
    if (window.confirm("Are you sure you want to remove all saved articles?")) {
      setSavedArticles([]);
      localStorage.removeItem(STORAGE_KEY_SAVED);
      toast.error("All saved articles removed.");
    }
  };

  /** Handle pagination click in search mode (pageNumber in [1..50]) */
  const handlePageClick = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > maxAllowedPages) return;

    // If user tries to go forward but hasMore=false => ignore
    if (pageNumber > page && !hasMore) return;

    fetchArticles(searchTopic, pageNumber);
  };

  /* ---------------- Rendering the chunk-based pagination in search mode ---------------- */

  // For chunk-based pagination: 5 pages at a time
  const currentChunk = Math.floor((page - 1) / pagesPerChunk);
  const startPage = currentChunk * pagesPerChunk + 1;
  const endPage = Math.min(startPage + pagesPerChunk - 1, maxAllowedPages);

  return (
    <div className="bg-gradient-to-tr from-zinc-600 to-zinc-900 p-6 rounded-lg shadow-lg text-white">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Search Row */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Search Dev.to articles..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/70 focus:ring-2 focus:ring-cyan-300"
        />
        <button
          onClick={handleSearch}
          className="bg-indigo-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 transition flex items-center gap-1"
        >
          <FaSearch />
          Search
        </button>

        {/* Clear Button (Search Mode only) */}
        {isSearchMode && (
          <button
            onClick={handleClearSearch}
            className="text-sm text-gray-600 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-1"
          >
            <FaTrash /> Clear
          </button>
        )}
      </div>

      {/* Suggestions & Sort Row */}
      <div className="flex items-center justify-between mb-3">
        {/* Topic Suggestions */}
        <div className="flex items-center gap-2">
          {TOPIC_SUGGESTIONS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleSuggestionClick(topic)}
              className="text-sm text-white bg-white/10 px-2 py-1 rounded-md hover:bg-white/20 transition"
            >
              #{topic}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-2 py-1 text-sm rounded-md border border-white/20 bg-white/10 text-white"
          >
            <option value="reactions">Reactions</option>
            <option value="published_at">Newest</option>
            <option value="comments_count">Comments</option>
          </select>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center text-white text-sm mt-3 animate-pulse">
          <FaSpinner className="animate-spin mr-2" />
          Fetching articles...
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {/* Heading for Search Mode */}
      {!isLoading && isSearchMode && (
        articles.length > 0 ? (
          <h2 className="text-lg font-semibold text-white mt-3">
            Search results for: <span className="text-orange-300">{searchTopic}</span>
          </h2>
        ) : (
          <h2 className="text-lg font-semibold text-white mt-3">
            No results found for: <span className="text-orange-300">{searchTopic}</span>
          </h2>
        )
      )}

      {/* Articles List */}
      <ul className="space-y-3 mt-3">
        {articles.map((article) => (
          <li key={article.id} className="bg-white rounded-md shadow-sm p-4">
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="w-28 h-20 flex-shrink-0 rounded-sm overflow-hidden bg-gray-300 text-xs text-gray-500 flex items-center justify-center">
                {article.cover_image ? (
                  <Image
                    src={article.cover_image}
                    alt={article.title}
                    className="object-cover w-full h-full"
                    width={100} 
                    height={80} 
                  />
                ) : (
                  <span>No image</span>
                )}
              </div>

              {/* Article Content */}
              <div className="flex flex-col justify-between flex-grow">
                {/* Title & Star */}
                <div className="flex justify-between items-start">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-gray-900 hover:text-indigo-500 transition"
                  >
                    {article.title}
                  </a>
                  <button
                    onClick={() => toggleSaveArticle(article)}
                    className="text-yellow-500 hover:text-yellow-600 transition ml-2"
                    title="Save / Unsave article"
                  >
                    {/* We can show a different icon if saved, but FaRegStar is fine */}
                    {savedArticles.some((a) => a.id === article.id) ? (
                      <FaRegStar size={16} />
                    ) : (
                      <FaRegStar size={16} />
                    )}
                  </button>
                </div>

                {/* Author / Stats */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  {article.user.profile_image && (
                    <Image
                      src={article.user.profile_image}
                      alt={article.user.name}
                      className="w-5 h-5 rounded-full"
                      width={100} 
                      height={80}
                    />
                  )}
                  <span className="font-medium">{article.user.name}</span>
                  <span>💖 {article.positive_reactions_count}</span>
                  <span>🗨️ {article.comments_count}</span>
                </div>

                {/* Time & Tags */}
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <div className="flex gap-2">
                    <span>⏱ {article.reading_time_minutes} min</span>
                    <span>📅 {new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1">
                    {article.tag_list.map((tagItem) => (
                      <span
                        key={tagItem}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px]"
                      >
                        {tagItem}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Default Mode: Suggest More (only if not in search mode) */}
      {!isLoading && !isSearchMode && articles.length > 0 && (
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

      {/* Search Mode Pagination (chunked, 5 pages each) */}
      {isSearchMode && !isLoading && articles.length > 0 && (
        <div className="flex justify-center mt-4 gap-2">
          {/* If there's a previous chunk, show "<" */}
          {startPage > 1 && (
            <button
              className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
              onClick={() => handlePageClick(startPage - 1)}
            >
              &lt;
            </button>
          )}

          {/* Pages in this chunk */}
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

          {/* If we have more pages & haven't hit 50, show ">" */}
          {hasMore && endPage < maxAllowedPages && (
            <button
              className="px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
              onClick={() => handlePageClick(endPage + 1)}
            >
              &gt;
            </button>
          )}
        </div>
      )}

      {/* Saved Articles */}
      {savedArticles.length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-md shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">Saved Articles</h2>
            <button
              onClick={clearAllSavedArticles}
              className="text-red-500 text-xs hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* List of Saved Articles */}
          <ul className="space-y-2">
            {savedArticles.map((sa) => (
              <li key={sa.id} className="bg-white rounded-md shadow-sm p-4">
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-28 h-20 flex-shrink-0 rounded-sm overflow-hidden bg-gray-300 text-xs text-gray-500 flex items-center justify-center">
                    {sa.cover_image ? (
                      <Image
                        src={sa.cover_image}
                        alt={sa.title}
                        className="object-cover w-full h-full"
                        width={100} 
                        height={80}
                      />
                    ) : (
                      <span>No image</span>
                    )}
                  </div>

                  <div className="flex flex-col justify-between flex-grow">
                    <div className="flex justify-between items-start">
                      <a
                        href={sa.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-gray-900 hover:text-indigo-500 transition"
                      >
                        {sa.title}
                      </a>
                      <button
                        onClick={() => toggleSaveArticle(sa)}
                        className="text-yellow-500 hover:text-yellow-600 transition ml-2"
                      >
                        <FaRegStar size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      {sa.user.profile_image && (
                        <Image
                          src={sa.user.profile_image}
                          alt={sa.user.name}
                          className="w-5 h-5 rounded-full"
                          width={100}
                          height={80}
                        />
                      )}
                      <span className="font-medium">{sa.user.name}</span>
                      <span>💖 {sa.positive_reactions_count}</span>
                      <span>🗨️ {sa.comments_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <div className="flex gap-2">
                        <span>⏱ {sa.reading_time_minutes} min</span>
                        <span>📅 {new Date(sa.published_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1">
                        {sa.tag_list.map((tagList) => (
                          <span
                            key={tagList}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px]"
                          >
                            {tagList}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}