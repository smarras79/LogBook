/**
 * AwardWallet API Integration Service
 *
 * Uses the AwardWallet Account Access API to fetch real loyalty program balances.
 * Docs: https://business.awardwallet.com/api/account
 *
 * Setup:
 *   1. Register a business account at https://business.awardwallet.com
 *   2. Get your API key from https://business.awardwallet.com/profile/api
 *   3. Store the key in Firebase Remote Config or Firestore under 'config/awardwallet'
 *
 * The OAuth flow allows end users to connect their personal AwardWallet accounts,
 * granting this app read access to their loyalty program balances.
 */

const AW_API_BASE = 'https://business.awardwallet.com/api/export/v1';

/**
 * Fetch loyalty balances for a connected AwardWallet user.
 * @param {string} apiKey - AwardWallet business API key
 * @param {number} userId - AwardWallet connected user ID
 * @returns {Promise<Array>} Array of { provider, displayName, balance, balanceRaw, expirationDate, properties }
 */
export const fetchUserLoyaltyBalances = async (apiKey, userId) => {
  const response = await fetch(`${AW_API_BASE}/connectedUser/${userId}`, {
    headers: {
      'X-Authentication': apiKey,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`AwardWallet API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Extract loyalty accounts from the response
  if (!data.accounts || !Array.isArray(data.accounts)) {
    return [];
  }

  return data.accounts.map(account => ({
    provider: account.provider || '',
    displayName: account.displayName || account.provider || 'Unknown',
    balance: account.balance || '0',
    balanceRaw: account.balanceRaw || 0,
    expirationDate: account.expirationDate || null,
    lastRetrieveDate: account.lastRetrieveDate || null,
    properties: account.properties || []
  }));
};

/**
 * Fetch the list of all supported loyalty program providers.
 * @param {string} apiKey - AwardWallet business API key
 * @returns {Promise<Array>} Array of { code, name, type }
 */
export const fetchProvidersList = async (apiKey) => {
  const response = await fetch(`${AW_API_BASE}/providers/list`, {
    headers: {
      'X-Authentication': apiKey,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`AwardWallet API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Build the OAuth connection URL for a user to connect their AwardWallet account.
 * After authorization, AwardWallet redirects back with a connection code.
 *
 * @param {string} apiKey - AwardWallet business API key
 * @param {string} callbackUrl - URL to redirect to after authorization
 * @returns {string} The OAuth authorization URL
 */
export const getAwardWalletConnectUrl = (apiKey, callbackUrl) => {
  const params = new URLSearchParams({
    key: apiKey,
    callback: callbackUrl
  });
  return `https://business.awardwallet.com/connect?${params.toString()}`;
};

/**
 * Exchange a connection code for user details after OAuth callback.
 * The code is only valid for 1 minute after the redirect.
 *
 * @param {string} apiKey - AwardWallet business API key
 * @param {string} code - Connection code from OAuth callback
 * @returns {Promise<Object>} Connected user info { userId, fullName, email, status }
 */
export const exchangeConnectionCode = async (apiKey, code) => {
  const response = await fetch(`${AW_API_BASE}/get-connection-info/${code}`, {
    headers: {
      'X-Authentication': apiKey,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`AwardWallet connection error: ${response.status}`);
  }

  return response.json();
};
