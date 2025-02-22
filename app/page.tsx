"use client";

import { JSX, useState } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaStackOverflow, FaSearch, FaRocket } from "react-icons/fa";
import Link from "next/link";

export default function Home() {
  const [tagInput, setTagInput] = useState("");

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* 🌟 Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20">
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          DevTool Dashboard 🚀
        </motion.h1>
        <p className="text-lg md:text-xl text-gray-300 mt-4 max-w-2xl">
          Your one-stop hub for **GitHub activity**, **Stack Overflow trends**, and **Dev.to insights**.
        </p>

        {/* ✅ Go to Dashboard Button */}
        <Link
          href="/dashboard"
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition flex items-center gap-2"
        >
          <FaRocket /> Go to Dashboard
        </Link>
      </section>

      {/* 🔥 Key Features */}
      <section className="px-6 py-16 bg-gray-800">
        <h2 className="text-3xl font-bold text-center mb-8">Why Developers Love This? 💡</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <FeatureCard icon={<FaStackOverflow size={40} />} title="Trending Stack Overflow" description="See what's hot in the developer community." />
          <FeatureCard icon={<FaGithub size={40} />} title="GitHub Insights" description="Monitor repositories and track open-source activity." />
          <FeatureCard icon={<FaSearch size={40} />} title="Smart Search" description="Find relevant developer discussions instantly." />
        </div>
      </section>

      {/* 🔎 Search Preview */}
      <section className="px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">🔎 Try It Now</h2>
        <p className="text-center text-gray-300 mb-6">Search for a topic to see real-time results.</p>
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search by tag (e.g., reactjs, node.js)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-5 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Link
              href={`/search?tag=${tagInput}`}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-500"
            >
              <FaSearch size={22} />
            </Link>
          </div>
        </div>
      </section>

      {/* 📖 How It Works */}
      <section className="px-6 py-16 bg-gray-800">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works 📌</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <StepCard step="1" title="Search a Topic" description="Enter a tag or keyword to find relevant content." />
          <StepCard step="2" title="Sort & Save" description="Sort results by relevance, stars, or answers." />
          <StepCard step="3" title="Monitor & Share" description="Save your favorite questions and insights." />
        </div>
      </section>

      {/* 🚀 Call to Action */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Start Exploring Now 🚀</h2>
        <p className="text-gray-300 mb-6">Get started with a single click.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold">
          Go to Dashboard
        </Link>
      </section>

      {/* 📖 Footer */}
      <footer className="text-center text-gray-400 py-6 bg-gray-900">
        <p>
          Built with ❤️ for developers. Open source on{" "}
          <a href="https://github.com/owen-richards-1/DevTool-Dashboard" className="text-blue-400 hover:underline">
            GitHub
          </a>.
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: JSX.Element; title: string; description: string }) {
  return (
    <motion.div
      className="p-6 bg-gray-700 rounded-lg shadow-md"
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex justify-center mb-4 text-blue-400">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-300 mt-2">{description}</p>
    </motion.div>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <motion.div
      className="p-6 bg-gray-700 rounded-lg shadow-md"
      whileHover={{ scale: 1.05 }}
    >
      <h3 className="text-2xl font-bold text-blue-400 mb-2">Step {step}</h3>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="text-gray-300 mt-2">{description}</p>
    </motion.div>
  );
}