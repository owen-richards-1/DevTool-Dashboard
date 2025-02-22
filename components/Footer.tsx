"use client";
import Link from "next/link";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Left Section: Copyright */}
        <p className="text-sm text-accent-dark dark:text-accent-light">
          © {currentYear} Owen Richards. All rights reserved.
        </p>

        {/* Right Section: Social Links */}
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