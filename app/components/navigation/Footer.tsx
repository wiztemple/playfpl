import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">FPL Stakes</h3>
            <p className="text-sm text-gray-600">
              The premier platform for Fantasy Premier League cash contests and
              competitions.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/leagues/weekly"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Weekly Leagues
                </Link>
              </li>
              <li>
                <Link
                  href="/leagues/my-leagues"
                  className="text-gray-600 hover:text-blue-600"
                >
                  My Leagues
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-gray-600 hover:text-blue-600"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-blue-600">
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/responsible-gaming"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Responsible Gaming
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} FPL Stakes. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="https://twitter.com"
                className="text-gray-500 hover:text-blue-600"
              >
                Twitter
              </Link>
              <Link
                href="https://facebook.com"
                className="text-gray-500 hover:text-blue-600"
              >
                Facebook
              </Link>
              <Link
                href="https://instagram.com"
                className="text-gray-500 hover:text-blue-600"
              >
                Instagram
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
