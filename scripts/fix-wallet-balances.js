// // scripts/fix-wallet-balances.js
// const { PrismaClient } = require('@prisma/client');

// async function fixWalletBalances() {
//   console.log('Starting wallet balance repair script...');
//   const prisma = new PrismaClient();

//   try {
//     // Get all wallets
//     const wallets = await prisma.wallet.findMany({
//       include: {
//         transactions: {
//           where: {
//             status: 'completed'
//           }
//         }
//       }
//     });

//     console.log(`Found ${wallets.length} wallets to check`);

//     for (const wallet of wallets) {
//       const userId = wallet.userId;
//       console.log(`\nChecking wallet for user ${userId}...`);
//       console.log(`Current balance: ${wallet.balance}`);

//       // Identify incorrect transactions (amounts in kobo instead of naira)
//       const suspiciousTransactions = wallet.transactions.filter(
//         tx => Math.abs(tx.amount) > 1000000
//       );

//       if (suspiciousTransactions.length > 0) {
//         console.log(`Found ${suspiciousTransactions.length} suspicious transactions (possible kobo values)`);
        
//         // Fix these transactions first
//         for (const tx of suspiciousTransactions) {
//           const oldAmount = tx.amount;
//           const newAmount = oldAmount / 100; // Convert from kobo to naira
          
//           console.log(`Fixing transaction ${tx.id}: ${oldAmount} -> ${newAmount}`);
          
//           await prisma.transaction.update({
//             where: { id: tx.id },
//             data: { amount: newAmount }
//           });
//         }
//       }

//       // Recalculate the correct balance based on transactions
//       const updatedTransactions = await prisma.transaction.findMany({
//         where: {
//           walletId: wallet.id,
//           status: 'completed'
//         }
//       });

//       const calculatedBalance = updatedTransactions.reduce(
//         (sum, tx) => sum + tx.amount, 
//         0
//       );

//       console.log(`Calculated balance: ${calculatedBalance}`);

//       // Fix wallet balance if it's incorrect
//       if (Math.abs(wallet.balance - calculatedBalance) > 0.01) {
//         console.log(`Updating wallet balance from ${wallet.balance} to ${calculatedBalance}`);
        
//         await prisma.wallet.update({
//           where: { id: wallet.id },
//           data: { balance: calculatedBalance }
//         });

//         // Check balance after update
//         const updatedWallet = await prisma.wallet.findUnique({
//           where: { id: wallet.id }
//         });
        
//         console.log(`New balance: ${updatedWallet?.balance}`);
//       } else {
//         console.log('Wallet balance is correct, no update needed');
//       }
//     }

//     console.log('\nWallet repair completed successfully!');
//   } catch (error) {
//     console.error('Error fixing wallet balances:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Run the function
// fixWalletBalances()
//   .then(() => process.exit(0))
//   .catch(err => {
//     console.error(err);
//     process.exit(1);
//   });

// scripts/fix-balance.js
const { PrismaClient } = require('@prisma/client');

async function fixSpecificWallet() {
  console.log('Starting targeted wallet fix...');
  const prisma = new PrismaClient();

  try {
    // Step 1: Find the problematic wallet
    const wallet = await prisma.wallet.findFirst({
      where: {
        balance: {
          lt: -1000000 // Find wallets with extremely negative balances
        }
      }
    });

    if (!wallet) {
      console.log('No wallet with extreme negative balance found');
      return;
    }

    console.log(`Found wallet with ID ${wallet.id} and balance ${wallet.balance}`);

    // Step 2: Get all completed transactions for this wallet
    const transactions = await prisma.transaction.findMany({
      where: {
        walletId: wallet.id,
        status: 'completed'
      }
    });

    console.log(`Found ${transactions.length} transactions for this wallet`);

    // Step 3: Analyze transactions to understand the pattern
    let depositSum = 0;
    let withdrawalSum = 0;

    for (const tx of transactions) {
      if (tx.type === 'deposit' || tx.amount > 0) {
        depositSum += tx.amount;
      } else if (tx.type === 'withdrawal' || tx.amount < 0) {
        withdrawalSum += tx.amount;
      }
    }

    console.log(`Total deposits: ${depositSum}`);
    console.log(`Total withdrawals: ${withdrawalSum}`);
    console.log(`Net amount: ${depositSum + withdrawalSum}`);

    // Step 4: Fix by either making balance positive or setting to a reasonable value
    // Option 1: Make the balance positive (if it should be positive)
    const correctedBalance = Math.abs(wallet.balance);
    
    // Option 2: Set to calculated balance from transactions
    // const correctedBalance = depositSum + withdrawalSum;
    
    // Option 3: Reset to zero (most conservative)
    // const correctedBalance = 0;

    console.log(`Setting balance to: ${correctedBalance}`);

    // Update the wallet balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: correctedBalance }
    });

    console.log('Wallet balance updated successfully');

    // Verify the fix
    const updatedWallet = await prisma.wallet.findUnique({
      where: { id: wallet.id }
    });
    
    console.log(`New balance: ${updatedWallet.balance}`);
  } catch (error) {
    console.error('Error fixing wallet:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificWallet()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });