"use client";

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { ChevronRight, Check, Link as LinkIcon, Trophy, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              How FPL Stakes Works
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join weekly cash contests based on your Fantasy Premier League team performance
            </p>
          </motion.div>
          
          {/* Step 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-20"
          >
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="md:w-1/2">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-indigo-900/30">1</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-100">Connect Your FPL Team</h2>
                <p className="text-gray-400 mb-6">
                  Link your official Fantasy Premier League team to our platform using your team ID. Your existing FPL team will be used to earn points in our cash contests.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">No need to create a new fantasy team</span>
                  </li>
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Uses your official FPL points</span>
                  </li>
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Same transfers, captain choices, and chips as your regular team</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden backdrop-blur-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="aspect-video relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6">
                        <LinkIcon className="h-12 w-12 text-indigo-500 mb-4 opacity-80" />
                        <span className="text-center text-gray-500">Connect your existing FPL team with just your team ID</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Step 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-20"
          >
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-8">
              <div className="md:w-1/2">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-indigo-900/30">2</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-100">Join Weekly Contests</h2>
                <p className="text-gray-400 mb-6">
                  Browse available contests and join the ones you like. We offer contests with various entry fees to suit all budgets, from $5 to $100.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Short-term commitment — just one gameweek</span>
                  </li>
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Various contest sizes from 10 to 1000 participants</span>
                  </li>
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Multiple prize structures available</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden backdrop-blur-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="aspect-video relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6">
                        <Trophy className="h-12 w-12 text-indigo-500 mb-4 opacity-80" />
                        <span className="text-center text-gray-500">Choose from a variety of contests with different entry fees and prize pools</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Step 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-20"
          >
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="md:w-1/2">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-indigo-900/30">3</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-100">Compete & Win</h2>
                <p className="text-gray-400 mb-6">
                  Your FPL team's gameweek performance determines your ranking. Points are calculated using the official FPL scoring system. The highest-scoring managers win cash prizes.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Real-time leaderboard updates</span>
                  </li>
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Standard FPL scoring rules</span>
                  </li>
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Top performers win cash prizes</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden backdrop-blur-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="aspect-video relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6">
                        <Trophy className="h-12 w-12 text-green-500 mb-4 opacity-80" />
                        <span className="text-center text-gray-500">Compete against other managers and win based on your team's performance</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Step 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-20"
          >
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-8">
              <div className="md:w-1/2">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-indigo-900/30">4</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-100">Cash Out Anytime</h2>
                <p className="text-gray-400 mb-6">
                  Withdraw your winnings to your bank account or use them to join more contests. Funds are securely held in your wallet until you're ready to cash out.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Fast and secure withdrawals</span>
                  </li>
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Multiple payment methods</span>
                  </li>
                  <li className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <Check className="h-5 w-5 text-indigo-400 mr-3 mt-0.5" />
                    <span className="text-gray-300">Transparent transaction history</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden backdrop-blur-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="aspect-video relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6">
                        <Wallet className="h-12 w-12 text-indigo-500 mb-4 opacity-80" />
                        <span className="text-center text-gray-500">Withdraw your winnings securely whenever you want</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* FAQ Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold mb-10 text-center bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-3 text-indigo-300">Is FPL Stakes legal?</h3>
                  <p className="text-gray-400">
                    FPL Stakes operates as a fantasy sports contest platform, which is legal in many countries and jurisdictions. However, availability may vary based on your location due to local gambling regulations. Always check your local laws before participating.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-3 text-indigo-300">How do you calculate my points?</h3>
                  <p className="text-gray-400">
                    We use the official Fantasy Premier League points system. Your points in our contests are exactly the same as your points in the official FPL game for the relevant gameweek.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-3 text-indigo-300">What happens if a match is postponed?</h3>
                  <p className="text-gray-400">
                    We follow the official FPL rules. If matches are postponed, those points will be calculated when the matches are played, unless the gameweek has been officially completed by FPL.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-3 text-indigo-300">How much can I win?</h3>
                  <p className="text-gray-400">
                    Winnings depend on the contest you join, the entry fee, and the number of participants. Each contest displays the prize pool and distribution before you enter.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-3 text-indigo-300">When will I receive my winnings?</h3>
                  <p className="text-gray-400">
                    Winnings are credited to your wallet automatically within 24 hours after the gameweek is completed and all points are finalized by the official FPL game.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* CTA Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="text-center bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-10 rounded-xl border border-indigo-800/50 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-700/20 via-transparent to-transparent"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-4 text-white">Ready to Put Your FPL Skills to the Test?</h2>
                <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                  Join thousands of FPL managers competing for cash prizes every gameweek.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/leagues/weekly">
                    <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 text-white">
                      Browse Available Leagues
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}