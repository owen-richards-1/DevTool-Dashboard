"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaTimes,
  FaStar,
  FaRegStar,
  FaEye,
  FaCheckCircle,
  FaSpinner,
  FaSearch,
  FaSyncAlt,
} from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import moment from "moment";
import Image from "next/image";

/** Type for Stack Overflow question */
interface Question {
  question_id: number;
  title: string;
  score: number;
  answer_count: number;
  view_count: number;
  link: string;
  tags: string[];
  creation_date: number;
  owner: {
    display_name: string;
    profile_image: string;
  };
}

/** LocalStorage key for saved questions */
const STORAGE_KEY_SAVED = "savedQuestions";

/** Default suggested tags for quick searching */
const SUGGESTED_TAGS = ["reactjs", "node.js", "csharp", "python", "java"];

/** Sort options for Stack Overflow */
const SORT_OPTIONS = [
  { value: "votes", label: "Stars" },
  { value: "creation", label: "Newest" },
  { value: "answer_count", label: "Answers" },
  { value: "view_count", label: "Views" },
];

/** Default sort for Stack Overflow */
const DEFAULT_SORT = "votes";

/**
 * StackOverflowTrends component
 * - Two modes:
 *   1) Default Mode (random page of top questions by DEFAULT_SORT)
 *   2) Search Mode (user typed a tag => chunked pagination)
 */
export default function StackOverflowTrends({ limit = 4 }: { limit?: number }) {
  const [tagInput, setTagInput] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [sortOption, setSortOption] = useState(DEFAULT_SORT);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Distinguish between Default Mode vs. Search Mode
  const [isSearchMode, setIsSearchMode] = useState(false);

  // For "search mode" pagination:
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // For displaying a heading like "Search results for: X"
  const [searchTopic, setSearchTopic] = useState("");

  // We'll interpret "limit" as "pageSize"
  const pageSize = limit; // 4 by default, or user-specified

  // We'll do chunk-based pagination with 5 pages per chunk
  const pagesPerChunk = 5;
  const maxAllowedPages = 50; // Arbitrarily limit to 50 pages

  /** Core fetch function for Stack Overflow */
  const fetchQuestions = useCallback(
    async (tag: string, pageNumber: number) => {
      setIsLoading(true);
      setError("");
      try {
        // Build query params
        const params: Record<string, string | number> = {
          order: "desc",
          sort: sortOption, // e.g. votes, view_count, answer_count
          site: "stackoverflow",
          pagesize: pageSize,
          page: pageNumber,
          filter: "!9_bDDxJY5", // basic question data
        };

        // If we have a tag, set "tagged"
        if (tag.trim()) {
          // NOTE: encodeURIComponent is not strictly needed here if axios does query param encoding
          // but we'll do it to be safe.
          params.tagged = encodeURIComponent(tag.trim());
        }

        const res = await axios.get("https://api.stackexchange.com/2.3/questions", {
          params,
        });
        if (res.status !== 200) {
          throw new Error(`API returned error: ${res.status}`);
        }

        const data = res.data;
        // Set the returned questions
        setQuestions(data.items || []);

        // The Stack Exchange API returns a boolean "has_more"
        setHasMore(data.has_more);

        // If user typed a tag => set the "searchTopic" for the heading
        setSearchTopic(tag);

        // Update the "page" in state
        setPage(pageNumber);
      } catch (err) {
        console.error("Error fetching Stack Overflow questions:", err);
        setError("Failed to fetch questions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, sortOption]
  );

  /**
   * Default Mode: fetch random page of top questions by default sort.
   */
  const fetchDefaultQuestions = useCallback(() => {
    setIsSearchMode(false);
    const randomPage = Math.floor(Math.random() * 5) + 1;
    fetchQuestions("", randomPage);
  }, [fetchQuestions]);

  /** On mount, load saved questions + fetch default questions */
  useEffect(() => {
    // Load saved questions from localStorage
    const storedSaved = localStorage.getItem(STORAGE_KEY_SAVED);
    if (storedSaved) {
      setSavedQuestions(JSON.parse(storedSaved));
    }

    // Default mode fetch
    fetchDefaultQuestions();
  }, [fetchDefaultQuestions]);

  /** Handle changing the "sort by" dropdown */
  const handleSortChange = (newSort: string) => {
    setSortOption(newSort);
    if (isSearchMode) {
      // Re-fetch current search with page=1
      fetchQuestions(searchTopic, 1);
    } else {
      // Re-fetch default mode, page=1
      fetchQuestions("", 1);
    }
  };

  /** Search by tag (from user input) => switch to Search Mode */
  const handleSearch = () => {
    if (!tagInput.trim()) {
      toast.error("Please enter a tag to search.");
      return;
    }
    setIsSearchMode(true);
    fetchQuestions(tagInput, 1);
  };

  /** Called when user clicks a suggested tag */
  const fetchQuestionsByTag = (tag: string) => {
    setIsSearchMode(true);
    setTagInput(tag);
    fetchQuestions(tag, 1);
  };

  /** Clears search => revert to default mode */
  const handleClearSearch = () => {
    setTagInput("");
    fetchDefaultQuestions();
  };

  /** Suggest More button => random page of top questions (default) */
  const handleSuggestMore = () => {
    fetchDefaultQuestions();
  };

  /**
   * Chunk-based pagination in "search mode" only
   */
  const handlePageClick = (nextPage: number) => {
    // Bound nextPage between 1..50
    if (nextPage < 1) return;
    if (nextPage > maxAllowedPages) return;

    // If "hasMore" is false but the user tries to go forward, ignore
    if (nextPage > page && !hasMore) return;

    fetchQuestions(searchTopic, nextPage);
  };

  /** Toggle Save/Unsave a question */
  const toggleSaveQuestion = (question: Question) => {
    const isSaved = savedQuestions.some(
      (q) => q.question_id === question.question_id
    );
    let updated: Question[];

    if (isSaved) {
      updated = savedQuestions.filter(
        (q) => q.question_id !== question.question_id
      );
      toast.error("Removed from saved.");
    } else {
      updated = [...savedQuestions, question];
      toast.success("Saved to your questions.");
    }

    setSavedQuestions(updated);
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
  };

  /** Clear all saved questions */
  const clearAllSaved = () => {
    if (window.confirm("Are you sure you want to remove all saved questions?")) {
      setSavedQuestions([]);
      localStorage.removeItem(STORAGE_KEY_SAVED);
      toast.error("All saved questions removed.");
    }
  };

  // For chunk-based pagination, no total_count => indefinite pages up to maxAllowedPages
  const currentChunk = Math.floor((page - 1) / pagesPerChunk);
  const startPage = currentChunk * pagesPerChunk + 1;
  const endPage = Math.min(startPage + pagesPerChunk - 1, maxAllowedPages);

  return (
    <div className="bg-gradient-to-tr from-zinc-600 to-zinc-900 p-6 rounded-lg shadow-lg text-white">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Search Row */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Search Stack Overflow topics..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
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

      {/* Suggested Tags & Sort */}
      <div className="flex justify-between items-center mb-3">
        {/* Suggested Tags */}
        <div className="flex items-center gap-2">
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => fetchQuestionsByTag(tag)}
              className="text-sm text-white bg-white/10 px-2 py-1 rounded-md hover:bg-white/20 transition"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-white/10 text-white px-3 py-1 rounded-md text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center text-white text-sm mt-3 animate-pulse">
          <FaSpinner className="animate-spin mr-2" /> Fetching results...
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Results Heading (Search Mode only) */}
      {!isLoading && isSearchMode && (
        questions.length > 0 ? (
          <h2 className="text-lg font-semibold text-white mt-3">
            Search results for: <span className="text-orange-300">{searchTopic}</span>
          </h2>
        ) : (
          <h2 className="text-lg font-semibold text-white mt-3">
            No results found for: <span className="text-orange-300">{searchTopic}</span>
          </h2>
        )
      )}

      {/* Main Questions List */}
      <div className="space-y-4 mt-4">
        {questions.map((question) => (
          <div
            key={question.question_id}
            className="bg-white p-5 rounded-lg shadow-md border-l-4 border-orange-400"
          >
            <div className="flex items-center justify-between">
              {/* Profile Image & Title */}
              <div className="flex items-center gap-3">
                <Image
                  src={question.owner.profile_image}
                  alt={question.owner.display_name}
                  width={40}
                  height={40}
                  className="rounded-full border border-gray-300"
                />
                <a
                  href={question.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-gray-900 hover:text-indigo-500 transition"
                >
                  {question.title}
                </a>
              </div>
              {/* Save/Unsave Button */}
              <button onClick={() => toggleSaveQuestion(question)}>
                {savedQuestions.some(
                  (q) => q.question_id === question.question_id
                ) ? (
                  <FaStar className="text-yellow-500" size={16} />
                ) : (
                  <FaRegStar className="text-yellow-500 hover:text-yellow-600 transition ml-2" size={16} />
                )}
              </button>
            </div>

            {/* Metadata (Votes, Answers, Views, Time) */}
            <div className="flex gap-4 text-sm text-gray-700 mt-3">
              <span>🏆 {question.score} votes</span>
              <span>
                <FaCheckCircle className="inline text-green-500" />{" "}
                {question.answer_count} answers
              </span>
              <span>
                <FaEye className="inline text-blue-500" />{" "}
                {question.view_count} views
              </span>
              <span>⏳ {moment.unix(question.creation_date).fromNow()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Default Mode: Suggest More (only if not in search mode) */}
      {!isLoading && !isSearchMode && questions.length > 0 && (
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

      {/* Search Mode: chunk-based pagination if we have questions and not loading */}
      {isSearchMode && !isLoading && questions.length > 0 && (
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
          {/* If hasMore is true AND endPage < maxAllowedPages, show ">" */}
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

      {/* Saved Questions Section */}
      {savedQuestions.length > 0 && (
        <div className="mt-6 bg-white p-5 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">⭐ Saved Questions</h2>
            <button
              onClick={clearAllSaved}
              className="text-red-600 text-sm hover:text-red-800 transition"
            >
              Clear All
            </button>
          </div>
          {/* Saved Questions List */}
          <div className="space-y-4">
            {savedQuestions.map((q) => (
              <div
                key={q.question_id}
                className="bg-white p-5 rounded-lg shadow-md border-l-4 border-orange-400"
              >
                <div className="flex items-center justify-between">
                  {/* Profile Image & Title */}
                  <div className="flex items-center gap-3">
                    <Image
                      src={q.owner.profile_image}
                      alt={q.owner.display_name}
                      width={40}
                      height={40}
                      className="rounded-full border border-gray-300"
                    />
                    <a
                      href={q.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-gray-900 hover:text-indigo-500 transition"
                    >
                      {q.title}
                    </a>
                  </div>
                  {/* Remove from Saved Button */}
                  <button onClick={() => toggleSaveQuestion(q)}>
                    <FaTimes className="text-red-500 hover:text-red-700 transition" size={16} />
                  </button>
                </div>
                {/* Metadata (Votes, Answers, Views, Time) */}
                <div className="flex gap-4 text-sm text-gray-700 mt-3">
                  <span>🏆 {q.score} votes</span>
                  <span>
                    <FaCheckCircle className="inline text-green-500" />{" "}
                    {q.answer_count} answers
                  </span>
                  <span>
                    <FaEye className="inline text-blue-500" />{" "}
                    {q.view_count} views
                  </span>
                  <span>⏳ {moment.unix(q.creation_date).fromNow()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}