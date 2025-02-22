"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaStackOverflow,
  FaTimes,
  FaStar,
  FaRegStar,
  FaEye,
  FaCheckCircle,
  FaSpinner,
  FaSearch,
} from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import moment from "moment";
import Link from "next/link";

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

const STORAGE_KEY_SAVED = "savedQuestions";
const SUGGESTED_TAGS = ["reactjs", "node.js", "csharp", "python", "java"];
const SORT_OPTIONS = [
  { value: "votes", label: "Stars" },
  { value: "answer_count", label: "Answers" },
  { value: "view_count", label: "Views" },
];
const DEFAULT_SORT = "votes";

export default function StackOverflowTrends({
  limit = 4,
  showMore = false,
}: {
  limit?: number;
  showMore?: boolean;
}) {
  const [tagInput, setTagInput] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [sortOption, setSortOption] = useState(DEFAULT_SORT);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTopic, setSearchTopic] = useState(""); // Last searched topic

  useEffect(() => {
    // Load saved questions from localStorage
    const storedSaved = localStorage.getItem(STORAGE_KEY_SAVED);
    if (storedSaved) setSavedQuestions(JSON.parse(storedSaved));

    // Initial fetch (no specific tag)
    fetchQuestions("");
  }, []);

  /** Fetch questions from Stack Overflow */
  const fetchQuestions = async (tag: string) => {
    setIsLoading(true);
    setSearchTopic(tag); // For "Results for: X"
    try {
      // If showMore is true, fetch more items
      const pageSize = showMore ? 10 : 6;

      // Build API params for Stack Exchange
      const params: Record<string, string | number> = {
        order: "desc",
        sort: sortOption, // "votes", "answer_count", or "view_count"
        site: "stackoverflow",
        pagesize: pageSize,
        filter: "!9_bDDxJY5", // Basic question data
      };

      // If user searched for a tag, encode it
      if (tag.trim()) {
        params.tagged = encodeURIComponent(tag.trim());
      }

      // Perform API request
      const res = await axios.get("https://api.stackexchange.com/2.3/questions", { params });
      if (res.status !== 200) {
        throw new Error(`API returned error: ${res.status}`);
      }

      // No client-side sorting needed since we pass "sort" param,
      // but if we wanted to re-sort, we'd do it here:
      // e.g., setQuestions(sortQuestions(res.data.items, sortOption))
      setQuestions(res.data.items || []);
      setError("");
    } catch (err) {
      console.error("Error fetching Stack Overflow questions:", err);
      setError("Failed to fetch questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /** Sorting (if we want to apply custom sort after fetch) */
  // function sortQuestions(items: Question[], sortType: string): Question[] {
  //   return [...items].sort((a, b) => {
  //     switch (sortType) {
  //       case "votes":
  //         return b.score - a.score;
  //       case "answer_count":
  //         return b.answer_count - a.answer_count;
  //       case "view_count":
  //         return b.view_count - a.view_count;
  //       default:
  //         return 0;
  //     }
  //   });
  // }

  /** Run fetchQuestions again with new sort param */
  const handleSortChange = (newSort: string) => {
    setSortOption(newSort);
    fetchQuestions(searchTopic);
  };

  /** Search by tag (from user input or suggested tag) */
  const fetchQuestionsByTag = async (tag: string) => {
    if (!tag.trim()) {
      toast.error("Please enter a tag to search.");
      return;
    }
    await fetchQuestions(tag);
  };

  /** Toggle Save/Unsave a question */
  const toggleSaveQuestion = (question: Question) => {
    const isSaved = savedQuestions.some((q) => q.question_id === question.question_id);
    let updated;

    if (isSaved) {
      updated = savedQuestions.filter((q) => q.question_id !== question.question_id);
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

  return (
    <div className="bg-gradient-to-r from-indigo-400 to-cyan-400 p-6 rounded-lg shadow-lg text-white">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Search Row */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Search Stack Overflow tags (e.g., 'reactjs')"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/70 focus:ring-2 focus:ring-cyan-300"
        />
        <button
          onClick={() => fetchQuestionsByTag(tagInput)}
          className="bg-indigo-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 transition flex items-center gap-1"
        >
          <FaSearch /> Search
        </button>
      </div>

      {/* Suggested Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTED_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => fetchQuestionsByTag(tag)}
            className="bg-white/10 text-white px-3 py-1 rounded-full text-xs hover:bg-white/20 transition"
          >
            #{tag}
          </button>
        ))}
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 mb-3">
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

      {/* Results Heading */}
      {!isLoading && searchTopic && (
        <h2 className="text-lg font-semibold text-white mt-3">
          Results for: <span className="text-orange-300">{searchTopic}</span>
        </h2>
      )}

    <div className="space-y-4 mt-4">
      {questions.slice(0, limit).map((question) => (
        <div key={question.question_id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-orange-400">
          <div className="flex items-center justify-between">
            {/* ✅ Profile Image & Title */}
            <div className="flex items-center gap-3">
              <img
                src={question.owner.profile_image}
                alt={question.owner.display_name}
                className="w-10 h-10 rounded-full border border-gray-300"
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
              {savedQuestions.some((q) => q.question_id === question.question_id) ? (
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
              <FaCheckCircle className="inline text-green-500" /> {question.answer_count} answers
            </span>
            <span>
              <FaEye className="inline text-blue-500" /> {question.view_count} views
            </span>
            <span>⏳ {moment.unix(question.creation_date).fromNow()}</span>
          </div>
        </div>
      ))}
    </div>

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
          <ul className="space-y-3">
            {savedQuestions.map((q) => (
              <li key={q.question_id} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                <a href={q.link} className="text-gray-900 hover:text-indigo-500 transition" target="_blank" rel="noopener noreferrer">
                  {q.title}
                </a>
                <button onClick={() => toggleSaveQuestion(q)}>
                  <FaTimes className="text-red-500 hover:text-red-700 transition" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}