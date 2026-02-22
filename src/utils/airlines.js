// Airline-related utility functions

import { AIRLINE_ALLIANCES, AIRLINE_WEBSITES } from '../data/airlines';

// Check if a user's airline matches an alliance member
export const isAirlineMatch = (userAirline, memberAirline) => {
  if (!userAirline || !memberAirline) return false;

  const user = userAirline.toLowerCase().trim();
  const member = memberAirline.toLowerCase().trim();

  // Exact match
  if (user === member) return true;

  // Extract the core airline name (handle parentheses like "ANA (All Nippon Airways)")
  const memberCore = member.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const memberInParens = member.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '';

  // Check if user airline matches core or parenthetical name
  if (user === memberCore) return true;
  if (memberInParens && user === memberInParens) return true;

  // Check if user airline is contained in member name or vice versa
  // But use word boundaries to avoid "air" matching "airways"
  const userWords = user.split(/\s+/);
  const memberWords = memberCore.split(/\s+/);

  // If user entered a single word, check if it matches the first word of member
  // e.g., "Thai" should match "Thai Airways", "United" should match "United Airlines"
  if (userWords.length === 1) {
    if (memberWords[0] === userWords[0]) return true;
    // Also check common abbreviations
    if (memberInParens && memberInParens.split(/\s+/)[0] === userWords[0]) return true;
  }

  // Check if user's full input matches start of member name
  if (memberCore.startsWith(user)) return true;
  if (memberInParens && memberInParens.startsWith(user)) return true;

  // Check if member's core name (without "Airlines", "Airways", etc.) matches
  const memberWithoutSuffix = memberCore.replace(/\s*(airlines?|airways?|air lines?)\s*$/i, '').trim();
  if (user === memberWithoutSuffix) return true;
  if (user.replace(/\s*(airlines?|airways?|air lines?)\s*$/i, '').trim() === memberWithoutSuffix) return true;

  return false;
};

// Get airline website URL
export const getAirlineWebsite = (airlineName) => {
  if (!airlineName) return null;

  // Direct match
  if (AIRLINE_WEBSITES[airlineName]) {
    return AIRLINE_WEBSITES[airlineName];
  }

  // Case-insensitive search
  const normalizedName = airlineName.trim();
  for (const [airline, website] of Object.entries(AIRLINE_WEBSITES)) {
    if (airline.toLowerCase() === normalizedName.toLowerCase()) {
      return website;
    }
  }

  return null;
};

// Get airline alliance
export const getAirlineAlliance = (airlineName) => {
  if (!airlineName) return null;

  const normalizedName = airlineName.trim().toLowerCase();

  for (const [alliance, members] of Object.entries(AIRLINE_ALLIANCES)) {
    for (const member of members) {
      if (normalizedName.includes(member.toLowerCase()) ||
          member.toLowerCase().includes(normalizedName)) {
        return alliance;
      }
    }
  }

  return 'Independent';
};
