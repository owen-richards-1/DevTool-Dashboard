import Link from "next/link";
import { auth } from "@/auth";
import { FaGithub, FaStackOverflow, FaDev } from "react-icons/fa";

import GitHubStats from "@/components/GitHubStats";
import GitHubRepos from "@/components/GitHubRepos";
import StackOverflowTrends from "@/components/StackOverflowTrends";
import DevToBlogs from "@/components/DevToBlogs";

export default async function Dashboard() {

  const session = await auth()
 
  if (!session?.user) return null

  return (
    <div className="min-h-screen">
      <main className="p-10 max-w-6xl mx-auto">

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-center text-zinc-900 dark:text-zinc-100 mb-6">
          DevTool Dashboard 🚀
        </h1>
        <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8">
          Get insights into trending repositories, Stack Overflow discussions, and Dev.to articles.
        </p>

        {/* Grid Layout */}
        <div className="grid gap-8">
        
          {/* GitHub Stats Section */}
          <section className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            {/* Header - GitHub */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FaGithub className="text-white opacity-80" size={24} />
                <h1 className="text-2xl font-bold tracking-wide">
                  GitHub Stats
                </h1>
                {/* Sub-header - GitHub */}
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  View your overall GitHub contributions, repositories, and followers.
                </p>
              </div>
            </div>

            {/*  Developer Stats Section */}
            <GitHubStats />

            {/* GitHub Stats */}
            <GitHubRepos limit={4} />
            <div className="mt-4 flex justify-end">
              <Link
                href="/github"
                className="text-blue-500 hover:text-blue-700 transition text-sm font-semibold"
              >
                See More →
              </Link>
            </div>
          </section>

          {/* Stack Overflow Stats Section */}
          <section className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            {/* Header - Stack Overflow */}
            <div className="flex items-center gap-2 mb-4">
              <FaStackOverflow className="text-orange-500" size={24} />
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Stack Overflow Questions
              </h1>
              {/* Sub-header - Stack Overflow */}
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Find trending discussions and top-voted questions.
              </p>
            </div>

            {/* Stack Overflow Trends */}
            <StackOverflowTrends limit={4} />
            <div className="mt-4 flex justify-end">
              <Link
                href="/stackoverflow"
                className="text-blue-500 hover:text-blue-700 transition text-sm font-semibold"
              >
                See More →
              </Link>
            </div>
          </section>

          {/* Dev.to Blogs Section */}
          <section className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
            {/* Header - Dev.to */}
            <div className="flex items-center gap-2 mb-4">
              <FaDev className="text-zinc-900" size={24} />
              <h1 className="text-xl font-semibold text-white-900 dark:text-zinc-100">
                Dev.to Blogs
              </h1>
              {/* Sub-header - Dev.to */}
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Discover popular articles on Dev.to. Save your favorite articles for later reference.
              </p>
            </div>

            {/* Dev.to Blogs */}
            <DevToBlogs limit={4} />
            <div className="mt-4 flex justify-end">
              <Link
                href="/devto"
                className="text-blue-500 hover:text-blue-700 transition text-sm font-semibold"
              >
                See More →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}