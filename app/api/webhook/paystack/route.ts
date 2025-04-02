import { NextResponse } from 'next/server';
import { prisma } from "@/lib/db";
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        // Verify Paystack webhook signature
        const signature = request.headers.get('x-paystack-signature');
        if (!signature) {
            return NextResponse.json({ error: 'No signature found' }, { status: 400 });
        }

        const body = await request.text();
        const hash = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
            .update(body)
            .digest('hex');

        if (hash !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(body);
        const eventType = event.event;
        const data = event.data;

        // Handle different event types
        switch (eventType) {
            case 'charge.success':
                await handleChargeSuccess(data);
                break;
            case 'transfer.success':
                await handleTransferSuccess(data);
                break;
            case 'transfer.failed':
                await handleTransferFailed(data);
                break;
            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handleChargeSuccess(data: any) {
    const reference = data.reference;
    const metadata = data.metadata;

    // Skip if no metadata or not a wallet deposit
    if (!metadata || metadata.type !== 'wallet_deposit') {
        return;
    }

    const userId = metadata.userId;
    const walletId = metadata.walletId;
    const amount = data.amount / 100; // Convert from kobo to naira

    // Find the transaction
    const transaction = await prisma.transaction.findFirst({
        where: { externalReference: reference }
    });

    if (!transaction) {
        return;
    }

    // Update transaction and wallet in a transaction
    await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: 'completed' }
        });

        // Update wallet balance
        await tx.wallet.update({
            where: { id: walletId },
            data: {
                balance: {
                    increment: amount
                }
            }
        });
    });
}

async function handleTransferSuccess(data: any) {
    const reference = data.reference;

    // Find the transaction
    const transaction = await prisma.transaction.findFirst({
        where: { externalReference: reference }
    });

    if (!transaction) {
        return;
    }

    // Update transaction status
    await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' }
    });
}

async function handleTransferFailed(data: any) {
    const reference = data.reference;

    // Find the transaction
    const transaction = await prisma.transaction.findFirst({
        where: { externalReference: reference }
    });

    if (!transaction) {
        return;
    }

    // Get the wallet
    const wallet = await prisma.wallet.findUnique({
        where: { id: transaction.walletId }
    });

    if (!wallet) {
        return;
    }

    // Update transaction and refund wallet in a transaction
    await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: 'failed' }
        });

        // Refund wallet balance
        await tx.wallet.update({
            where: { id: wallet.id },
            data: {
                balance: {
                    increment: transaction.amount
                }
            }
        });

        // Create refund transaction without the metadata field
        await tx.transaction.create({
            data: {
                userId: transaction.userId,
                walletId: wallet.id,
                type: 'refund',
                amount: transaction.amount,
                currency: 'NGN',
                status: 'completed',
                externalReference: `refund_${reference}`
                // Removed the metadata field that was causing the error
            }
        });
    });
}