export interface UserBankAccount {
    id: string;
    userId: string;
    accountNumber: string; // Keep full number for edits/display logic, mask in UI
    accountName: string;
    bankName: string;
    bankCode: string | null;
    isDefault: boolean;
    createdAt: string; // Use string for ISO date format from API
    updatedAt: string; // Use string for ISO date format from API
}

// You might also want a type for the data needed to ADD an account
export interface AddBankAccountVars {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode?: string;
    isDefault?: boolean;
}

/**
 * Shape of the data for a withdrawal request as needed by the Admin UI.
 * Matches the response from GET /api/admin/withdrawals
 */
export interface ClientAdminWithdrawalRequest {
    id: string;
    amount: string; // String representation of Decimal
    currency: string;
    createdAt: string; // ISO Date String
    status: string; // TransactionStatus as string ('REQUIRES_APPROVAL', 'PROCESSING', etc.)
    externalReference: string | null;
    description: string | null;
    metadata: { // Structure depends on what you store in the API
        bankAccountId?: string;
        accountName?: string;
        accountNumber?: string;
        bankName?: string;
        bankCode?: string;
        [key: string]: any; // Allow other metadata properties
    } | null;
    userId: string;
    user: {
        name: string | null;
        email: string | null;
    } | null;
}

/**
 * Variables needed for the Approve Withdrawal mutation/API call.
 */
export interface ApproveWithdrawalVars {
    transactionId: string;
}

/**
 * Variables needed for the Reject Withdrawal mutation/API call.
 */
export interface RejectWithdrawalVars {
    transactionId: string;
    reason?: string; // Optional reason for rejection
}

/**
 * Variables needed for the Complete Withdrawal mutation/API call.
 */
export interface CompleteWithdrawalVars {
    transactionId: string;
    bankReference?: string; // Optional reference from the actual bank transfer
}

/**
 * Generic success response structure for admin withdrawal actions.
 * Matches responses from POST /approve, /reject, /complete APIs.
 */
export interface AdminActionSuccessResponse {
    success: boolean;
    message: string;
    transactionId: string;
    status?: string; // Optionally includes the new status
}
