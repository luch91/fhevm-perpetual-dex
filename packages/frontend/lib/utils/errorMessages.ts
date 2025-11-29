/**
 * User-Friendly Error Messages
 * Converts technical blockchain errors into actionable messages
 */

export interface ErrorDetails {
  title: string;
  message: string;
  action?: string;
  severity: 'error' | 'warning' | 'info';
}

export function parseContractError(error: any): ErrorDetails {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';

  // User rejected transaction
  if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
    return {
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction.',
      severity: 'info',
    };
  }

  // Insufficient funds
  if (errorMessage.includes('insufficient funds')) {
    return {
      title: 'Insufficient Balance',
      message: 'You don\'t have enough ETH to pay for gas fees.',
      action: 'Add more ETH to your wallet.',
      severity: 'error',
    };
  }

  // USDC approval needed
  if (errorMessage.includes('ERC20: insufficient allowance') ||
      errorMessage.includes('transfer amount exceeds allowance')) {
    return {
      title: 'USDC Approval Required',
      message: 'You need to approve the contract to spend your USDC first.',
      action: 'Click "Approve USDC" before opening a position.',
      severity: 'warning',
    };
  }

  // Insufficient USDC balance
  if (errorMessage.includes('ERC20: transfer amount exceeds balance')) {
    return {
      title: 'Insufficient USDC',
      message: 'You don\'t have enough USDC for this position.',
      action: 'Get test USDC or reduce your position size.',
      severity: 'error',
    };
  }

  // Invalid leverage
  if (errorMessage.includes('Invalid leverage')) {
    return {
      title: 'Invalid Leverage',
      message: 'Leverage must be between 1x and 10x.',
      action: 'Choose a leverage between 1x and 10x.',
      severity: 'error',
    };
  }

  // Size too small
  if (errorMessage.includes('Size must be greater than zero')) {
    return {
      title: 'Invalid Position Size',
      message: 'Position size must be greater than zero.',
      action: 'Enter a valid position size.',
      severity: 'error',
    };
  }

  // Collateral too small
  if (errorMessage.includes('Collateral must be greater than zero')) {
    return {
      title: 'Invalid Collateral',
      message: 'Collateral amount must be greater than zero.',
      action: 'Enter a valid collateral amount.',
      severity: 'error',
    };
  }

  // Price is stale
  if (errorMessage.includes('Price is stale')) {
    return {
      title: 'Price Data Outdated',
      message: 'The price oracle data is too old.',
      action: 'Wait a moment and try again.',
      severity: 'warning',
    };
  }

  // Position not open
  if (errorMessage.includes('Position not open')) {
    return {
      title: 'Position Already Closed',
      message: 'This position has already been closed.',
      severity: 'error',
    };
  }

  // Not position owner
  if (errorMessage.includes('Not position owner')) {
    return {
      title: 'Not Your Position',
      message: 'You can only close positions that you own.',
      severity: 'error',
    };
  }

  // Network/RPC errors
  if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return {
      title: 'Network Error',
      message: 'Failed to connect to the Sepolia network.',
      action: 'Check your internet connection and try again.',
      severity: 'error',
    };
  }

  // Gas estimation failed
  if (errorMessage.includes('cannot estimate gas') || errorMessage.includes('execution reverted')) {
    return {
      title: 'Transaction Will Fail',
      message: 'This transaction would fail. This usually means you need to approve USDC first or don\'t have enough balance.',
      action: 'Check your USDC balance and approval status.',
      severity: 'error',
    };
  }

  // Transaction failed
  if (errorMessage.includes('transaction failed')) {
    return {
      title: 'Transaction Failed',
      message: 'The transaction was rejected by the network.',
      action: 'Please try again.',
      severity: 'error',
    };
  }

  // Generic error
  return {
    title: 'Transaction Error',
    message: errorMessage.slice(0, 200), // Truncate long errors
    action: 'Please try again or contact support if the issue persists.',
    severity: 'error',
  };
}

/**
 * Format error for display in toast/alert
 */
export function formatErrorForDisplay(error: any): string {
  const details = parseContractError(error);
  let message = `${details.title}: ${details.message}`;
  if (details.action) {
    message += `\n\n${details.action}`;
  }
  return message;
}

/**
 * Check if user has enough USDC
 */
export function checkUSDCBalance(
  balance: bigint,
  required: bigint
): ErrorDetails | null {
  if (balance < required) {
    const balanceStr = (Number(balance) / 1e6).toFixed(2);
    const requiredStr = (Number(required) / 1e6).toFixed(2);
    return {
      title: 'Insufficient USDC',
      message: `You have ${balanceStr} USDC but need ${requiredStr} USDC.`,
      action: 'Get more test USDC or reduce your position size.',
      severity: 'error',
    };
  }
  return null;
}

/**
 * Check if user has approved enough USDC
 */
export function checkUSDCAllowance(
  allowance: bigint,
  required: bigint
): ErrorDetails | null {
  if (allowance < required) {
    return {
      title: 'USDC Approval Needed',
      message: 'You need to approve the contract to spend your USDC.',
      action: 'Click the "Approve USDC" button first.',
      severity: 'warning',
    };
  }
  return null;
}

/**
 * Validate position parameters
 */
export function validatePositionParams(
  size: number,
  collateral: number,
  leverage: number
): ErrorDetails | null {
  if (size <= 0) {
    return {
      title: 'Invalid Size',
      message: 'Position size must be greater than 0.',
      severity: 'error',
    };
  }

  if (collateral <= 0) {
    return {
      title: 'Invalid Collateral',
      message: 'Collateral must be greater than 0.',
      severity: 'error',
    };
  }

  if (leverage < 1 || leverage > 10) {
    return {
      title: 'Invalid Leverage',
      message: 'Leverage must be between 1x and 10x.',
      severity: 'error',
    };
  }

  return null;
}
