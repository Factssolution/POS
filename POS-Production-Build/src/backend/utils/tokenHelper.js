const { Order, Settings } = require('../models');
const { Op } = require('sequelize');

/**
 * Get default shop hours configuration
 */
function getDefaultShopHours() {
  return {
    monday:    { open: "10:00", close: "22:00", enabled: true },
    tuesday:   { open: "10:00", close: "22:00", enabled: true },
    wednesday: { open: "10:00", close: "22:00", enabled: true },
    thursday:  { open: "10:00", close: "22:00", enabled: true },
    friday:    { open: "14:00", close: "23:00", enabled: true },
    saturday:  { open: "10:00", close: "23:00", enabled: true },
    sunday:    { open: "12:00", close: "20:00", enabled: true }
  };
}

/**
 * Get shop hours from database
 */
async function getShopHours() {
  try {
    const shopHoursSetting = await Settings.findOne({
      where: { setting_key: 'shop_hours' }
    });
    
    return shopHoursSetting 
      ? JSON.parse(shopHoursSetting.setting_value)
      : getDefaultShopHours();
  } catch (error) {
    console.error('Error fetching shop hours:', error);
    return getDefaultShopHours();
  }
}

/**
 * Get shop hours for a specific day
 * @param {Date} date - The date to get shop hours for
 * @returns {Object} Shop hours for the day { open, close, enabled }
 */
async function getShopHoursForDay(date) {
  const shopHours = await getShopHours();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];
  return shopHours[dayName] || { open: "10:00", close: "22:00", enabled: true };
}

/**
 * Determine the business day for a given order time
 * Handles overnight scenarios (e.g., 4PM to 4AM)
 * 
 * @param {Date} orderDate - The order timestamp
 * @param {Object} dayShopHours - Shop hours for that day { open, close }
 * @returns {string} Business day date string (YYYY-MM-DD)
 */
function getBusinessDay(orderDate, dayShopHours) {
  const orderHour = orderDate.getHours();
  const orderMinute = orderDate.getMinutes();
  const orderTime = orderHour * 60 + orderMinute; // minutes from midnight
  
  const [closeHour, closeMinute] = dayShopHours.close.split(':').map(Number);
  const closeTime = closeHour * 60 + closeMinute;
  
  const [openHour, openMinute] = dayShopHours.open.split(':').map(Number);
  const openTime = openHour * 60 + openMinute;
  
  // If closing time < opening time, shop crosses midnight
  const crossesMidnight = closeTime < openTime;
  
  if (crossesMidnight) {
    // If order time is before closing time (e.g., 2AM < 4AM)
    // This means the order belongs to yesterday's business day
    if (orderTime < closeTime) {
      const businessDay = new Date(orderDate);
      businessDay.setDate(businessDay.getDate() - 1);
      return businessDay.toISOString().split('T')[0];
    }
  }
  
  return orderDate.toISOString().split('T')[0];
}

/**
 * Check if shop is currently open
 * @param {Date} checkTime - Time to check (defaults to now)
 * @returns {Object} Shop status information
 */
async function checkShopStatus(checkTime = new Date()) {
  const dayShopHours = await getShopHoursForDay(checkTime);
  
  const currentHour = checkTime.getHours();
  const currentMinute = checkTime.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [openHour, openMinute] = dayShopHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = dayShopHours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;
  
  const crossesMidnight = closeTime < openTime;
  
  let isOpen = false;
  
  if (!dayShopHours.enabled) {
    isOpen = false;
  } else if (crossesMidnight) {
    // Shop crosses midnight (e.g., 4PM to 4AM)
    isOpen = currentTime >= openTime || currentTime < closeTime;
  } else {
    // Normal hours (e.g., 10AM to 10PM)
    isOpen = currentTime >= openTime && currentTime < closeTime;
  }
  
  // Calculate business day and next reset time
  const businessDay = getBusinessDay(checkTime, dayShopHours);
  const nextReset = new Date(businessDay);
  nextReset.setDate(nextReset.getDate() + 1);
  nextReset.setHours(openHour, openMinute, 0, 0);
  
  // Check if this is a new business day (no orders yet today)
  const latestOrder = await Order.findOne({
    order: [['created_at', 'DESC']],
    attributes: ['token_date', 'created_at']
  });
  
  const isNewBusinessDay = !latestOrder || latestOrder.token_date !== businessDay;
  
  return {
    isOpen,
    businessDay,
    nextReset: nextReset.toISOString(),
    shopHours: dayShopHours,
    isNewBusinessDay
  };
}

/**
 * Get next token number for a business day
 * @param {string} businessDay - Business day date string (YYYY-MM-DD)
 * @param {Object} transaction - Optional Sequelize transaction
 * @returns {Object} { token_number, formatted_token }
 */
async function getNextTokenNumber(businessDay, transaction = null) {
  try {
    const queryOptions = transaction ? { transaction } : {};
    
    // Find the highest token number for this business day
    // IMPORTANT: Include ALL orders (even cancelled) to maintain token sequence integrity
    const maxTokenOrder = await Order.findOne({
      where: {
        token_date: businessDay
      },
      order: [['token_number', 'DESC']],
      ...queryOptions
    });
    
    const token_number = maxTokenOrder ? maxTokenOrder.token_number + 1 : 1;
    const formatted_token = `TOKEN #${token_number.toString().padStart(4, '0')}`;
    
    return {
      token_number,
      formatted_token
    };
  } catch (error) {
    console.error('Error getting next token number:', error);
    throw error;
  }
}

/**
 * Get date range for a specific time frame respecting shop hours
 * @param {string} timeFrame - 'today', 'week', 'month', or 'custom'
 * @param {string} customStartDate - Optional custom start date (YYYY-MM-DD)
 * @param {string} customEndDate - Optional custom end date (YYYY-MM-DD)
 * @returns {Object} { startDate, endDate, label }
 */
async function getDateRangeForTimeFrame(timeFrame = 'today', customStartDate = null, customEndDate = null) {
  const now = new Date();
  const shopHours = await getShopHours();
  const todayShopHours = await getShopHoursForDay(now);
  
  const [openHour, openMinute] = todayShopHours.open.split(':').map(Number);
  
  let startDate, endDate, label;
  
  if (timeFrame === 'custom' && customStartDate && customEndDate) {
    // Custom date range
    startDate = new Date(customStartDate);
    startDate.setHours(openHour, openMinute, 0, 0);
    
    endDate = new Date(customEndDate);
    endDate.setHours(23, 59, 59, 999);
    
    label = `${customStartDate} to ${customEndDate}`;
  } else if (timeFrame === 'week') {
    // This week (last 7 days)
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(openHour, openMinute, 0, 0);
    
    endDate = now;
    
    label = 'Last 7 Days';
  } else if (timeFrame === 'month') {
    // This month (last 30 days)
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(openHour, openMinute, 0, 0);
    
    endDate = now;
    
    label = 'Last 30 Days';
  } else {
    // Today (current business day)
    const businessDay = getBusinessDay(now, todayShopHours);
    startDate = new Date(businessDay);
    startDate.setHours(openHour, openMinute, 0, 0);
    
    endDate = now;
    
    label = `Business Day: ${businessDay}`;
  }
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    label
  };
}

module.exports = {
  getDefaultShopHours,
  getShopHours,
  getShopHoursForDay,
  getBusinessDay,
  checkShopStatus,
  getNextTokenNumber,
  getDateRangeForTimeFrame
};
