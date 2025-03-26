import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { ChevronRight, Check } from 'lucide-react';

export const metadata = {
  title: 'How It Works | FPL Stakes',
  description: 'Learn how to join FPL cash contests and win real money',
};

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">How FPL Stakes Works</h1>
        <p className="text-xl text-gray-600 mb-12 text-center">
          Join weekly cash contests based on your Fantasy Premier League team performance
        </p>
        
        {/* Step 1 */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="md:w-1/2">
              <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
              <h2 className="text-2xl font-bold mb-4">Connect Your FPL Team</h2>
              <p className="text-gray-600 mb-4">
                Link your official Fantasy Premier League team to our platform using your team ID. Your existing FPL team will be used to earn points in our cash contests.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>No need to create a new fantasy team</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Uses your official FPL points</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Same transfers, captain choices, and chips as your regular team</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-100 p-6 rounded-lg">
                <div className="aspect-video relative bg-gray-200 rounded-md">
                  {/* Replace with an actual image in production */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Connect FPL Team Illustration
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 2 */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-8">
            <div className="md:w-1/2">
              <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
              <h2 className="text-2xl font-bold mb-4">Join Weekly Contests</h2>
              <p className="text-gray-600 mb-4">
                Browse available contests and join the ones you like. We offer contests with various entry fees to suit all budgets, from $5 to $100.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Short-term commitment — just one gameweek</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Various contest sizes from 10 to 1000 participants</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Multiple prize structures available</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-100 p-6 rounded-lg">
                <div className="aspect-video relative bg-gray-200 rounded-md">
                  {/* Replace with an actual image in production */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Join Contests Illustration
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 3 */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="md:w-1/2">
              <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
              <h2 className="text-2xl font-bold mb-4">Compete & Win</h2>
              <p className="text-gray-600 mb-4">
                Your FPL team's gameweek performance determines your ranking. Points are calculated using the official FPL scoring system. The highest-scoring managers win cash prizes.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Real-time leaderboard updates</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Standard FPL scoring rules</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Top performers win cash prizes</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-100 p-6 rounded-lg">
                <div className="aspect-video relative bg-gray-200 rounded-md">
                  {/* Replace with an actual image in production */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Compete & Win Illustration
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 4 */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-8">
            <div className="md:w-1/2">
              <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">4</div>
              <h2 className="text-2xl font-bold mb-4">Cash Out Anytime</h2>
              <p className="text-gray-600 mb-4">
                Withdraw your winnings to your bank account or use them to join more contests. Funds are securely held in your wallet until you're ready to cash out.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Fast and secure withdrawals</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Multiple payment methods</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Transparent transaction history</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-100 p-6 rounded-lg">
                <div className="aspect-video relative bg-gray-200 rounded-md">
                  {/* Replace with an actual image in production */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Cash Out Illustration
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Is FPL Stakes legal?</h3>
              <p className="text-gray-600">
                FPL Stakes operates as a fantasy sports contest platform, which is legal in many countries and jurisdictions. However, availability may vary based on your location due to local gambling regulations. Always check your local laws before participating.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">How do you calculate my points?</h3>
              <p className="text-gray-600">
                We use the official Fantasy Premier League points system. Your points in our contests are exactly the same as your points in the official FPL game for the relevant gameweek.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What happens if a match is postponed?</h3>
              <p className="text-gray-600">
                We follow the official FPL rules. If matches are postponed, those points will be calculated when the matches are played, unless the gameweek has been officially completed by FPL.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">How much can I win?</h3>
              <p className="text-gray-600">
                Winnings depend on the contest you join, the entry fee, and the number of participants. Each contest displays the prize pool and distribution before you enter.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">When will I receive my winnings?</h3>
              <p className="text-gray-600">
                Winnings are credited to your wallet automatically within 24 hours after the gameweek is completed and all points are finalized by the official FPL game.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Ready to Put Your FPL Skills to the Test?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of FPL managers competing for cash prizes every gameweek.
          </p>
          <Link href="/leagues/weekly">
            <Button size="lg">
              Browse Available Leagues
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}