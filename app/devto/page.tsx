import DevToBlogs from "@/components/DevToBlogs";
import Link from "next/link";

export default function DevToPage() {
    return (
      <div className=" min-h-screen">
        <main className="p-10 max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
            Dev.to Blogs
          </h1>
  
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto mb-6">
            Explore trending blogs, developer stories, and software development articles.
          </p>
  
          {/*Dev.to Blogs - Full View */}
          <DevToBlogs limit={8} />
  
          {/* Back to Dashboard */}
          <div className="mt-6 flex justify-center">
            <Link
              href="/dashboard"
              className="text-blue-500 hover:text-blue-700 transition text-sm font-semibold"
            >
            ← Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }