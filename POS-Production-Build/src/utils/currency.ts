/**
 * Currency formatting utility for POS System
 * Default: Pakistani Rupee (PKR) - Rs
 */

export const CURRENCY_CONFIG = {
  code: 'PKR',
  symbol: 'Rs',
  name: 'Pakistani Rupee',
  locale: 'en-PK'
};

/**
 * Format amount with currency symbol
 * @param amount - The amount to format
 * @param symbol - Currency symbol (default: Rs)
 * @returns Formatted string (e.g., "Rs 1,234")
 */
export const formatCurrency = (amount: number | string, symbol: string = CURRENCY_CONFIG.symbol): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${symbol} 0`;
  return `${symbol} ${num.toLocaleString('en-PK')}`;
};

/**
 * Format amount without currency symbol
 * @param amount - The amount to format
 * @returns Formatted string (e.g., "1,234")
 */
export const formatAmount = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-PK');
};

/**
 * Get currency symbol from currency code
 * @param code - Currency code (PKR, USD, EUR, etc.)
 * @returns Currency symbol
 */
export const getCurrencySymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    PKR: 'Rs',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    SAR: '﷼',
    INR: '₹'
  };
  return symbols[code.toUpperCase()] || code;
};

/**
 * Parse currency string to number
 * @param value - Currency string (e.g., "Rs 1,234")
 * @returns Parsed number
 */
export const parseCurrency = (value: string): number => {
  // Remove currency symbol and commas
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};
