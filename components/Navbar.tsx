"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaGithub,
  FaStackOverflow,
  FaDev,
  FaBars,
  FaTimes,
  FaRocket,
} from "react-icons/fa";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // For toggling a small dropdown under the user name
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: session, status } = useSession();

  // Helper to sign user out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="w-full bg-gradient-to-b from-zinc-700 to-zinc-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo / Branding */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-wide flex items-center gap-2 hover:text-orange-400 transition"
        >
          <FaRocket size={22} /> DevTool Dashboard
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/dashboard" className="hover:text-white transition">
            Dashboard
          </Link>

          {/* Developer Links */}
          <Link
            href="https://github.com"
            target="_blank"
            className="text-gray-300 hover:text-white transition"
          >
            <FaGithub size={22} />
          </Link>
          <Link
            href="https://stackoverflow.com"
            target="_blank"
            className="text-gray-300 hover:text-orange-400 transition"
          >
            <FaStackOverflow size={22} />
          </Link>
          <Link
            href="https://dev.to"
            target="_blank"
            className="text-gray-300 hover:text-gray-100 transition"
          >
            <FaDev size={22} />
          </Link>

          {/* Conditionally Render: Hi, Name (with dropdown) OR Sign In */}
          {status === "loading" ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : session ? (
            // If user is signed in
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="bg-zinc-700 px-3 py-2 rounded-md hover:bg-zinc-600 transition flex items-center gap-2"
              >
                Hi, {session.user?.name ?? "User"}
                {/* An optional down-arrow icon could go here */}
                {/* <FaCaretDown /> */}
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-md shadow-lg py-2 z-50">
                  <Link
                    href="/profile"
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => alert("Settings clicked")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // If user is not signed in
            <button
              onClick={() => signIn()}
              className="bg-indigo-600 px-3 py-2 rounded-md text-white hover:bg-indigo-700 transition"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-md text-gray-300 hover:text-blue-400 transition"
        >
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* 📱 Mobile Slide-in Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 shadow-md py-4 px-6 space-y-4 absolute w-full left-0 top-16">
          <Link
            href="/dashboard"
            className="block py-2 text-white hover:text-blue-400 transition"
          >
            Dashboard
          </Link>

          {/* Developer Links */}
          <Link
            href="https://github.com"
            target="_blank"
            className="flex items-center gap-2 py-2 text-white hover:text-blue-400 transition"
          >
            <FaGithub size={20} />
            <span>GitHub</span>
          </Link>
          <Link
            href="https://stackoverflow.com"
            target="_blank"
            className="flex items-center gap-2 py-2 text-white hover:text-orange-400 transition"
          >
            <FaStackOverflow size={20} />
            <span>Stack Overflow</span>
          </Link>
          <Link
            href="https://dev.to"
            target="_blank"
            className="flex items-center gap-2 py-2 text-white hover:text-gray-300 transition"
          >
            <FaDev size={20} />
            <span>Dev.to</span>
          </Link>

          {/* Mobile: Hi, Name dropdown OR Sign In */}
          {status === "loading" ? (
            <p className="text-sm text-white">Loading...</p>
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="block w-full py-2 text-left bg-zinc-700 hover:bg-zinc-600 rounded-md px-3 transition"
              >
                Hi, {session.user?.name ?? "User"}
              </button>
              {menuOpen && (
                <div className="relative z-50 bg-white text-black rounded-md shadow-lg mt-2 py-2">
                  <button
                    onClick={() => alert("Profile clicked")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => alert("Settings clicked")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="block w-full py-2 text-left bg-indigo-600 hover:bg-indigo-700 rounded-md px-3 transition"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}