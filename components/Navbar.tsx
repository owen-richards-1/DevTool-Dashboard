"use client";

import { useState } from "react";
import Link from "next/link";
import { FaGithub, FaStackOverflow, FaDev, FaBars, FaTimes, FaSun, FaMoon, FaRocket, FaSearch } from "react-icons/fa";
import { useTheme } from "next-themes";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <nav className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo / Branding */}
        <Link href="/" className="text-2xl font-bold tracking-wide flex items-center gap-2 hover:text-orange-300 transition">
          <FaRocket size={22} /> DevTool Dashboard
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/dashboard" className="hover:text-white transition">
            Dashboard
          </Link>
          <Link href="/search" className="hover:text-white transition flex items-center gap-1">
            <FaSearch size={18} /> Search
          </Link>

          {/* Developer Links */}
          <Link href="https://github.com" target="_blank" className="text-gray-300 hover:text-white transition">
            <FaGithub size={22} />
          </Link>
          <Link href="https://stackoverflow.com" target="_blank" className="text-gray-300 hover:text-orange-400 transition">
            <FaStackOverflow size={22} />
          </Link>
          <Link href="https://dev.to" target="_blank" className="text-gray-300 hover:text-gray-100 transition">
            <FaDev size={22} />
          </Link>

          {/* 🌙 Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md text-gray-300 hover:text-yellow-500 hover:bg-gray-800 transition"
          >
            {theme === "dark" ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>

        {/* 📱 Mobile Menu Button */}
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
          
          {/* Primary Navigation */}
          <Link href="/dashboard" className="block py-2 text-white hover:text-blue-400 transition">
            Dashboard
          </Link>
          <Link href="/search" className="block py-2 text-white hover:text-blue-400 transition flex items-center gap-1">
            <FaSearch size={18} /> Search
          </Link>

          {/* Developer Links */}
          <Link href="https://github.com" target="_blank" className="flex items-center gap-2 py-2 text-white hover:text-blue-400 transition">
            <FaGithub size={20} />
            <span>GitHub</span>
          </Link>
          <Link href="https://stackoverflow.com" target="_blank" className="flex items-center gap-2 py-2 text-white hover:text-orange-400 transition">
            <FaStackOverflow size={20} />
            <span>Stack Overflow</span>
          </Link>
          <Link href="https://dev.to" target="_blank" className="flex items-center gap-2 py-2 text-white hover:text-gray-300 transition">
            <FaDev size={20} />
            <span>Dev.to</span>
          </Link>

          {/* 🌙 Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="mt-4 w-full flex items-center justify-center p-3 rounded-md bg-gray-800 text-gray-100 hover:bg-gray-700 transition"
          >
            {theme === "dark" ? <FaSun size={20} /> : <FaMoon size={20} />}
            <span className="ml-2">Toggle Theme</span>
          </button>
        </div>
      )}
    </nav>
  );
}