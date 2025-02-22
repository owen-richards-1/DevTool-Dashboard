"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaDev,
  FaRegStar,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";

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

const STORAGE_KEY_SAVED = "savedDevToArticles";
const TOPIC_SUGGESTIONS = ["ai", "databases", "react", "node", "tailwind"];
const SORT_OPTIONS = ["reactions", "published_at", "comments_count"];

/**
 * @param limit - How many articles to display
 * @param showMore - If true, fetch & show more articles 
 */
export default function DevToBlogs({
  limit = 3,
  showMore = false,
}: {
  limit?: number;
  showMore?: boolean;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("reactions");

  useEffect(() => {
    const storedSaved = localStorage.getItem(STORAGE_KEY_SAVED);
    if (storedSaved) setSavedArticles(JSON.parse(storedSaved));

    // Initial fetch
    fetchArticles("", sortOption);
  }, []);

  // Whenever savedArticles changes, sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedArticles));
  }, [savedArticles]);

  /** 
   * Fetch Dev.to Articles 
   * If showMore is true => fetch more results
   */
  const fetchArticles = async (keyword: string, sortParam: string) => {
    try {
      const perPage = showMore ? 8 : 6; // e.g. fetch more if it's the full page
      let url = `https://dev.to/api/articles?per_page=${perPage}`;

      // If a keyword is provided, add "&tag=..."
      if (keyword.trim()) {
        url += `&tag=${keyword.toLowerCase()}`;
      }

      // Fetch
      const res = await axios.get<Article[]>(url);
      let fetched = res.data;

      // Apply client-side sorting
      fetched = [...fetched].sort((a, b) => {
        switch (sortParam) {
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

      setArticles(fetched);
      setError("");
    } catch (err) {
      console.error("Error fetching Dev.to articles:", err);
      setError("Failed to fetch articles. Please try again.");
    }
  };

  /** Handle search by keyword */
  const handleSearch = () => {
    fetchArticles(searchInput, sortOption);
  };

  /** Clear the search input */
  const handleClearSearch = () => {
    setSearchInput("");
    fetchArticles("", sortOption);
  };

  /** When user clicks on a suggested topic */
  const handleSuggestionClick = (topic: string) => {
    setSearchInput(topic);
    fetchArticles(topic, sortOption);
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

  return (
    <div className="bg-gradient-to-r from-indigo-400 to-cyan-400 p-6 rounded-lg shadow-lg text-white">
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
        {searchInput && (
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
        <div className="flex flex-wrap gap-2">
          {TOPIC_SUGGESTIONS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleSuggestionClick(topic)}
              className="bg-white/10 text-white px-3 py-1 rounded-full text-xs hover:bg-white/20 transition"
            >
              #{topic}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-gray-100 text-sm">Sort by:</label>
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              fetchArticles(searchInput, e.target.value);
            }}
            className="px-2 py-1 text-sm rounded-md border border-white/20 bg-white/10 text-white"
          >
            <option value="reactions">Reactions</option>
            <option value="published_at">Newest</option>
            <option value="comments_count">Comments</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {/* Articles List (Apply limit) */}
      <ul className="space-y-3">
        {articles.slice(0, limit).map((article) => (
          <li key={article.id} className="bg-white rounded-md shadow-sm p-4">
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="w-28 h-20 flex-shrink-0 rounded-sm overflow-hidden bg-gray-300 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                {article.cover_image ? (
                  <img
                    src={article.cover_image}
                    alt={article.title}
                    className="object-cover w-full h-full"
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
                    {savedArticles.some((a) => a.id === article.id) ? (
                      <FaRegStar size={16} />
                    ) : (
                      <FaRegStar size={16} />
                    )}
                  </button>
                </div>

                {/* Author / Stats */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {article.user.profile_image && (
                    <img
                      src={article.user.profile_image}
                      alt={article.user.name}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="font-medium">{article.user.name}</span>
                  <span>💖 {article.positive_reactions_count}</span>
                  <span>🗨️ {article.comments_count}</span>
                </div>

                {/* Time & Tags */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <div className="flex gap-2">
                    <span>⏱ {article.reading_time_minutes} min</span>
                    <span>📅 {new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1">
                    {article.tag_list.map((tagItem) => (
                      <span
                        key={tagItem}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-[10px]"
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
                  <div className="w-28 h-20 flex-shrink-0 rounded-sm overflow-hidden bg-gray-300 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                    {sa.cover_image ? (
                      <img
                        src={sa.cover_image}
                        alt={sa.title}
                        className="object-cover w-full h-full"
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
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {sa.user.profile_image && (
                        <img
                          src={sa.user.profile_image}
                          alt={sa.user.name}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="font-medium">{sa.user.name}</span>
                      <span>💖 {sa.positive_reactions_count}</span>
                      <span>🗨️ {sa.comments_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <div className="flex gap-2">
                        <span>⏱ {sa.reading_time_minutes} min</span>
                        <span>📅 {new Date(sa.published_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1">
                        {sa.tag_list.map((tagList) => (
                          <span
                            key={tagList}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-[10px]"
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

      {/* 
        If you want a "See More" button like GitHubStats, 
        you can add:
          {!showMore && (
            <Link href="/devto" ...>See More →</Link>
          )}
      */}
    </div>
  );
}