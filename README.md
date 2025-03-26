# FPL Stakes - Fantasy Premier League Monetization Platform

FPL Stakes is a full-stack Next.js 15 application that allows Fantasy Premier League (FPL) enthusiasts to join cash contests based on their FPL team performance. The platform features weekly mini-leagues where users can stake money on their FPL team's performance.

## Key Features

- **Weekly Mini-Leagues**: Join competitions with entry fees based on FPL performance
- **User Authentication**: Secure login with Google or Email
- **FPL Integration**: Connect your official Fantasy Premier League team
- **Secure Payments**: Stripe integration for handling payments and payouts
- **Wallet System**: Manage winnings and withdrawals
- **Automated Results**: Automatic processing of gameweek results

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: Custom UI with Tailwind CSS and Radix UI primitives
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe
- **State Management**: React Hooks
- **API Integration**: Fantasy Premier League API

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL database
- Stripe account for payment processing

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fplstakes"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (for email provider)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="noreply@yourapp.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/fpl-stakes.git
   cd fpl-stakes
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   ```
   npx prisma db push
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Application Structure

- `/app`: Next.js app router pages and API routes
- `/components`: Reusable React components
- `/lib`: Utility functions and service integrations
- `/models`: TypeScript interfaces and Prisma schema
- `/hooks`: Custom React hooks
- `/prisma`: Database schema and migrations

## API Routes

- `/api/auth/*`: Authentication endpoints
- `/api/leagues/weekly`: Weekly league management
- `/api/fpl/*`: Fantasy Premier League data integration
- `/api/payments/*`: Payment processing endpoints

## Legal Considerations

When implementing this application for real-world use, consider the following:

1. **Gambling Regulations**: Ensure compliance with local gambling laws
2. **Terms of Service**: Create clear terms that users must accept
3. **KYC/AML**: Implement Know Your Customer and Anti-Money Laundering procedures
4. **Age Verification**: Verify users are of legal age
5. **Data Protection**: Comply with GDPR or other relevant data protection laws

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is for educational purposes only. Implementing a real-money gaming platform requires compliance with various legal regulations that vary by jurisdiction. Consult legal experts before deploying such a platform commercially.