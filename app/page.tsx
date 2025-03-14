"use client";

import { JSX } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaStackOverflow, FaSearch, FaRocket, FaDev } from "react-icons/fa";
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  const handleNavigation = () => {
    if (status === "loading") return; // Prevent navigation while loading
    if (session) {
      window.location.href = "/dashboard"; // Redirect signed-in users
    } else {
      signIn(); // Redirect non-authenticated users to sign-in
    }
  };

  return (
    <main className="min-h-screen text-white">
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
        <p className="text-lg md:text-xl text-zinc-300 mt-4 max-w-2xl">
          Your one-stop hub for GitHub activity, Stack Overflow trends, and Dev.to insights.
        </p>

        <button
          onClick={handleNavigation}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition flex items-center gap-2"
        >
          <FaRocket /> Go to Dashboard
        </button>
      </section>

      {/* Key Features */}
      <section className="px-6 py-16 bg-zinc-800">
        <h2 className="text-3xl font-bold text-center mb-8">Why Developers Love This? 💡</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {/* Stack Overlow */}
          <FeatureCard icon={<FaStackOverflow size={40} />} title="Trending Stack Overflow" description="See what's hot in the developer community." />
          {/* GitHub */}
          <FeatureCard icon={<FaGithub size={40} />} title="GitHub Insights" description="Monitor repositories and track open-source activity." />
          {/* Dev.to */}
          <FeatureCard icon={<FaDev size={40} />} title="Dev.to Articles" description="Find the latest articles on Dev.to with ease." />
        </div>
      </section>
      
      {/* About Section */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">About DevTool Dashboard</h2>
        <p className="text-zinc-300 mb-3 max-w-xl mx-auto text-sm sm:text-base">
          DevTool Dashboard is a comprehensive platform that consolidates your GitHub activity,
          Stack Overflow discussions, and Dev.to insights, giving you a complete overview of
          your developer ecosystem.
        </p>
        <p className="text-zinc-300 max-w-xl mx-auto text-sm sm:text-base">
          Built by developers, for developers, our aim is to boost your productivity and
          keep you informed about the latest trends, all in one place.
        </p>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: JSX.Element; title: string; description: string }) {
  return (
    <motion.div
      className="p-6 bg-zinc-700 rounded-lg shadow-md"
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex justify-center mb-4 text-blue-400">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-zinc-300 mt-2">{description}</p>
    </motion.div>
  );
}
