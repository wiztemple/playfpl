"use client";

import React from "react";
import Link from "next/link";
import { Twitter, Facebook, Instagram, Mail, Shield, Trophy, Heart, HelpCircle, FileText, AlertTriangle, Star, Calendar, Users, TrendingUp, Award, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800/50 bg-gradient-to-b from-gray-950 to-black backdrop-blur-md relative overflow-hidden">
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-900/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-blue-900/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-pink-900/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-2/3 w-32 h-32 bg-green-900/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Top section with logo and newsletter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-12 border-b border-gray-800/50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-8 md:mb-0"
          >
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              FPL Stakes
            </h2>
            <p className="text-sm text-gray-400 max-w-md">
              The premier platform for Fantasy Premier League cash contests and
              competitions. Join thousands of managers competing for real prizes.
            </p>
            <div className="flex items-center mt-4 space-x-3">
              <Link
                href="/about"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                About Us
              </Link>
              <span className="text-gray-700">•</span>
              <Link
                href="/careers"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Careers
              </Link>
              <span className="text-gray-700">•</span>
              <Link
                href="/press"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Press
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-full md:w-auto"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-lg p-4 md:p-6">
              <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-indigo-400" />
                Stay Updated
              </h3>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="bg-gray-800/50 border border-gray-700/50 rounded-l-md px-4 py-2 text-sm text-gray-200 flex-grow focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-r-md px-4 py-2 text-sm font-medium transition-all duration-200">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Get weekly FPL tips, league updates, and exclusive offers.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Enhanced main footer links section - now with 5 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm font-semibold uppercase text-gray-300 mb-4 flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-indigo-400" />
              Leagues
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/leagues/weekly"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Weekly Leagues
                </Link>
              </li>
              <li>
                <Link
                  href="/leagues/my-leagues"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  My Leagues
                </Link>
              </li>
              <li>
                <Link
                  href="/leagues/create"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Create League
                </Link>
              </li>
              <li>
                <Link
                  href="/leagues/featured"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Featured Leagues
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm font-semibold uppercase text-gray-300 mb-4 flex items-center">
              <Zap className="h-4 w-4 mr-2 text-indigo-400" />
              FPL Resources
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/fpl-tips"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  FPL Tips & Strategy
                </Link>
              </li>
              <li>
                <Link
                  href="/player-stats"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Player Statistics
                </Link>
              </li>
              <li>
                <Link
                  href="/fixtures"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Fixture Analysis
                </Link>
              </li>
              <li>
                <Link
                  href="/team-reveals"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Pro Team Reveals
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm font-semibold uppercase text-gray-300 mb-4 flex items-center">
              <Users className="h-4 w-4 mr-2 text-indigo-400" />
              Community
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/blog"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  FPL Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/forum"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Community Forum
                </Link>
              </li>
              <li>
                <Link
                  href="/discord"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Discord Server
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Live Events
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm font-semibold uppercase text-gray-300 mb-4 flex items-center">
              <HelpCircle className="h-4 w-4 mr-2 text-indigo-400" />
              Support
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/faq"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/account-support"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Account Support
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm font-semibold uppercase text-gray-300 mb-4 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-indigo-400" />
              Legal
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/responsible-gaming"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Responsible Gaming
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-gray-700 rounded-full mr-2 group-hover:bg-indigo-400 transition-colors"></span>
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Enhanced social media section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h3 className="text-sm font-semibold uppercase text-gray-300 mb-4 text-center">
            Connect With Us
          </h3>
          <div className="flex justify-center space-x-4">
            <Link
              href="https://twitter.com"
              className="bg-gray-900/30 hover:bg-gray-800/50 border border-gray-800/50 rounded-full p-3 transition-all duration-200 hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5 text-indigo-400" />
            </Link>
            <Link
              href="https://facebook.com"
              className="bg-gray-900/30 hover:bg-gray-800/50 border border-gray-800/50 rounded-full p-3 transition-all duration-200 hover:scale-110"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5 text-indigo-400" />
            </Link>
            <Link
              href="https://instagram.com"
              className="bg-gray-900/30 hover:bg-gray-800/50 border border-gray-800/50 rounded-full p-3 transition-all duration-200 hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5 text-indigo-400" />
            </Link>
            <Link
              href="mailto:contact@fplstakes.com"
              className="bg-gray-900/30 hover:bg-gray-800/50 border border-gray-800/50 rounded-full p-3 transition-all duration-200 hover:scale-110"
              aria-label="Email"
            >
              <Mail className="h-5 w-5 text-indigo-400" />
            </Link>
          </div>
        </motion.div>

        {/* Enhanced trust badges section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 py-8 border-y border-gray-800/50 mb-8"
        >
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-300">Secure Platform</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-gray-300">Responsible Gaming</span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-sm text-gray-300">24/7 Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-300">Verified Payouts</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-300">Trusted by Managers</span>
          </div>
        </motion.div>

        {/* Bottom copyright section - removed payment methods */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-sm text-gray-400 mb-4 md:mb-0"
          >
            &copy; {currentYear} FPL Stakes. All rights reserved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col items-center md:items-end"
          >
            <p className="text-xs text-gray-500 max-w-md text-center md:text-right">
              FPL Stakes is a fantasy sports platform for entertainment purposes.
              Please gamble responsibly and be aware of your local laws regarding fantasy sports contests.
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
