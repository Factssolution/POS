const crypto = require('crypto');

/**
 * License Key Generator
 * Format: FACTS-XXXX-XXXX-XXXX-XXXX
 * Example: FACTS-7A3B-9C2D-4E5F-6G7H
 */

class LicenseGenerator {
  /**
   * Generate a unique license key
   * @param {Object} options - Generation options
   * @returns {string} License key
   */
  static generateKey(options = {}) {
    const {
      clientId = null,
      planType = 'monthly',
      customPrefix = 'FACTS'
    } = options;

    // Generate 4 random segments (4 chars each)
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(this._generateSegment());
    }

    // Format: FACTS-XXXX-XXXX-XXXX-XXXX
    const licenseKey = `${customPrefix}-${segments.join('-')}`;

    console.log(` License Key Generated: ${licenseKey}`);
    console.log(`   Plan: ${planType}`);
    if (clientId) console.log(`   Client ID: ${clientId}`);

    return licenseKey;
  }

  /**
   * Generate a random 4-character segment
   * @returns {string}
   */
  static _generateSegment() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let segment = '';
    
    for (let i = 0; i < 4; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      segment += chars[randomIndex];
    }

    return segment;
  }

  /**
   * Validate license key format
   * @param {string} licenseKey
   * @returns {boolean}
   */
  static validateFormat(licenseKey) {
    if (!licenseKey) return false;

    // Pattern: FACTS-XXXX-XXXX-XXXX-XXXX
    const pattern = /^FACTS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(licenseKey);
  }

  /**
   * Calculate expiry date based on plan type
   * @param {string} planType
   * @param {Date} startDate
   * @returns {Date}
   */
  static calculateExpiryDate(planType, startDate = new Date()) {
    const expiryDate = new Date(startDate);

    switch (planType.toLowerCase()) {
      case 'monthly':
        expiryDate.setDate(expiryDate.getDate() + 30);
        break;
      case 'yearly':
        expiryDate.setDate(expiryDate.getDate() + 365);
        break;
      case 'lifetime':
        expiryDate.setFullYear(expiryDate.getFullYear() + 100); // 100 years
        break;
      default:
        expiryDate.setDate(expiryDate.getDate() + 30);
    }

    return expiryDate;
  }

  /**
   * Calculate trial end date
   * @param {number} trialDays
   * @param {Date} startDate
   * @returns {Date}
   */
  static calculateTrialEndDate(trialDays = 45, startDate = new Date()) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trialDays);
    return endDate;
  }

  /**
   * Check if license is expired
   * @param {Date} expiryDate
   * @returns {boolean}
   */
  static isExpired(expiryDate) {
    if (!expiryDate) return true;
    return new Date() > new Date(expiryDate);
  }

  /**
   * Get days remaining until expiry
   * @param {Date} expiryDate
   * @returns {number}
   */
  static getDaysRemaining(expiryDate) {
    if (!expiryDate) return 0;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
}

module.exports = LicenseGenerator;
