import React from "react";
import Link from "next/link";
import { Twitter, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 backdrop-blur-md bg-opacity-90">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              FPL Stakes
            </h3>
            <p className="text-sm text-gray-400">
              The premier platform for Fantasy Premier League cash contests and
              competitions.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-300 mb-4">
              Platform
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/leagues/weekly"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                >
                  Weekly Leagues
                </Link>
              </li>
              <li>
                <Link
                  href="/leagues/my-leagues"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                >
                  My Leagues
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-300 mb-4">
              Support
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  href="/faq" 
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-300 mb-4">
              Legal
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/responsible-gaming"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                >
                  Responsible Gaming
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} FPL Stakes. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="https://twitter.com"
                className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="https://facebook.com"
                className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com"
                className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center md:text-left">
            FPL Stakes is a fantasy sports platform for entertainment purposes.
            Please gamble responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
