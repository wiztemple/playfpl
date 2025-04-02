// scripts/reset-wallet.js
const { PrismaClient } = require('@prisma/client');

async function resetWalletBalance() {
  console.log('Starting wallet reset...');
  const prisma = new PrismaClient();

  try {
    // Get all wallets with extremely high balances
    const wallets = await prisma.wallet.findMany({
      where: {
        OR: [
          { balance: { gt: 100000 } },  // Greater than 100,000 naira
          { balance: { lt: -100000 } }  // Less than -100,000 naira
        ]
      }
    });

    console.log(`Found ${wallets.length} wallet(s) with extreme balances`);

    for (const wallet of wallets) {
      console.log(`Wallet ID: ${wallet.id}, Current balance: ${wallet.balance}`);
      
      // Option 1: Reset to a reasonable test value (e.g., 10,000 naira)
      const newBalance = 10000;
      
      // Option 2: Reset to zero
      // const newBalance = 0;
      
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance }
      });
      
      console.log(`Reset balance to ${newBalance} naira`);
      
      // Also mark any large transactions as "historical"
      const largeTransactions = await prisma.transaction.findMany({
        where: {
          walletId: wallet.id,
          OR: [
            { amount: { gt: 100000 } },
            { amount: { lt: -100000 } }
          ]
        }
      });
      
      if (largeTransactions.length > 0) {
        console.log(`Found ${largeTransactions.length} large transactions to mark as historical`);
        
        // Update these transactions
        await Promise.all(largeTransactions.map(tx => 
          prisma.transaction.update({
            where: { id: tx.id },
            data: { 
              status: 'historical',
              description: `[BALANCE RESET] ${tx.description || tx.type}`
            }
          })
        ));
      }
      
      // Create a note transaction to explain the reset
      await prisma.transaction.create({
        data: {
          userId: wallet.userId,
          walletId: wallet.id,
          type: "adjustment",
          amount: 0, // Zero-amount adjustment
          currency: "NGN",
          status: "completed",
          description: `Wallet balance reset to ${newBalance} naira. Previous balance: ${wallet.balance} naira.`,
        }
      });
    }

    console.log('Reset completed successfully!');
  } catch (error) {
    console.error('Error resetting wallet:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetWalletBalance()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });