"use client";
import Link from "next/link";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center bg-gradient-to-t from-zinc-700 to-zinc-900">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col items-center gap-2">
        {/* Tagline */}
        <p>
          Built by developers, for developers. Open source on{" "}
          <a
            href="https://github.com/owen-richards-1/DevTool-Dashboard"
            className="text-blue-400 hover:underline"
          >
            GitHub
          </a>.
        </p>

        {/* Copyright Section */}
        <p className="text-sm text-accent-dark dark:text-accent-light">
          © {currentYear} Owen Richards. All rights reserved.
        </p>

        {/* Social Links Section */}
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-dark dark:text-accent-light hover:text-accent dark:hover:text-accent-dark transition"
          >
            <FaGithub size={18} />
          </Link>

          <Link
            href="https://twitter.com/yourhandle"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-dark dark:text-accent-light hover:text-accent dark:hover:text-accent-dark transition"
          >
            <FaTwitter size={18} />
          </Link>

          <Link
            href="https://linkedin.com/in/yourprofile"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-dark dark:text-accent-light hover:text-accent dark:hover:text-accent-dark transition"
          >
            <FaLinkedin size={18} />
          </Link>
        </div>
      </div>
    </footer>
  );
}