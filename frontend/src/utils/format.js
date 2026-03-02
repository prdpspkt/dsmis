/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'INR')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'INR') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00'
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format a date string or Date object
 * @param {string|Date} date - The date to format
 * @param {string} format - Format type: 'short', 'long', 'full'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  }

  return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(dateObj)
}

/**
 * Format a date and time string
 * @param {string|Date} dateTime - The date and time to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(dateTime) {
  if (!dateTime) return ''

  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

/**
 * Format a phone number
 * @param {string} phone - The phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return ''

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  return phone
}

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Format a percentage
 * @param {number} value - The value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }

  return `${(value * 100).toFixed(decimals)}%`
}

// ============================================
// Timezone Utilities for Asia/Kathmandu (UTC+5:45)
// ============================================

const KATHMANDU_TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Kathmandu'

/**
 * Convert a date string or Date object to Asia/Kathmandu timezone
 * @param {string|Date} date - The date to convert
 * @returns {Date} Date object in Kathmandu timezone
 */
export function toKathmanduTime(date) {
  if (!date) return null

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return null
  }

  // Convert to Kathmandu timezone string
  return new Date(dateObj.toLocaleString('en-US', { timeZone: KATHMANDU_TIMEZONE }))
}

/**
 * Format a date in Asia/Kathmandu timezone
 * @param {string|Date} date - The date to format
 * @param {string} format - Format type: 'short', 'long', 'full'
 * @returns {string} Formatted date string in Kathmandu timezone
 */
export function formatDateKathmandu(date, format = 'short') {
  if (!date) return ''

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric', timeZone: KATHMANDU_TIMEZONE },
    long: { year: 'numeric', month: 'long', day: 'numeric', timeZone: KATHMANDU_TIMEZONE },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: KATHMANDU_TIMEZONE }
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(dateObj)
}

/**
 * Format a date and time in Asia/Kathmandu timezone
 * @param {string|Date} dateTime - The date and time to format
 * @returns {string} Formatted date and time string in Kathmandu timezone
 */
export function formatDateTimeKathmandu(dateTime) {
  if (!dateTime) return ''

  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: KATHMANDU_TIMEZONE
  }).format(dateObj)
}

/**
 * Format a date to ISO string in Asia/Kathmandu timezone (for input fields)
 * @param {string|Date} date - The date to format
 * @returns {string} ISO date string (YYYY-MM-DD) in Kathmandu timezone
 */
export function toISODateKathmandu(date) {
  if (!date) return ''

  const kathmanduDate = toKathmanduTime(date)
  if (!kathmanduDate) return ''

  return kathmanduDate.toISOString().split('T')[0]
}

/**
 * Format a datetime to ISO string in Asia/Kathmandu timezone (for input fields)
 * @param {string|Date} dateTime - The datetime to format
 * @returns {string} ISO datetime string (YYYY-MM-DDTHH:mm) in Kathmandu timezone
 */
export function toISODateTimeKathmandu(dateTime) {
  if (!dateTime) return ''

  const kathmanduDate = toKathmanduTime(dateTime)
  if (!kathmanduDate) return ''

  const year = kathmanduDate.getFullYear()
  const month = String(kathmanduDate.getMonth() + 1).padStart(2, '0')
  const day = String(kathmanduDate.getDate()).padStart(2, '0')
  const hours = String(kathmanduDate.getHours()).padStart(2, '0')
  const minutes = String(kathmanduDate.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Get current date/time in Asia/Kathmandu timezone
 * @returns {Date} Current date object in Kathmandu timezone
 */
export function getCurrentKathmanduTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: KATHMANDU_TIMEZONE }))
}
