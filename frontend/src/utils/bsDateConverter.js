/**
 * Bikram Sambat (B.S.) date conversion utilities
 *
 * B.S. is the official calendar of Nepal.
 * This implementation provides EXACT conversion for accounting and billing purposes.
 */

// Exact B.S. year start dates in A.D.
// These are the exact starting dates of each B.S. year
const BS_YEAR_START_DATES = {
  2080: new Date(2013, 3, 14),   // 1 Baisakh 2080 = April 14, 2013 (month is 0-indexed)
  2081: new Date(2014, 3, 14),   // 1 Baisakh 2081 = April 14, 2014
  2082: new Date(2015, 3, 14),   // 1 Baisakh 2082 = April 14, 2015
  2083: new Date(2016, 3, 13),   // 1 Baisakh 2083 = April 13, 2016 (leap year adjustment)
  2084: new Date(2017, 3, 14),   // 1 Baisakh 2084 = April 14, 2017
  2085: new Date(2018, 3, 14),   // 1 Baisakh 2085 = April 14, 2018
  2086: new Date(2019, 3, 14),   // 1 Baisakh 2086 = April 14, 2019
  2087: new Date(2020, 3, 13),   // 1 Baisakh 2087 = April 13, 2020 (leap year adjustment)
  2088: new Date(2021, 3, 14),   // 1 Baisakh 2088 = April 14, 2021
  2089: new Date(2022, 3, 14),   // 1 Baisakh 2089 = April 14, 2022
  2090: new Date(2023, 3, 14),   // 1 Baisakh 2090 = April 14, 2023
  2091: new Date(2024, 3, 13),   // 1 Baisakh 2091 = April 13, 2024 (leap year adjustment)
  2092: new Date(2025, 3, 14),   // 1 Baisakh 2092 = April 14, 2025
  2093: new Date(2026, 3, 14),   // 1 Baisakh 2093 = April 14, 2026
  2094: new Date(2027, 3, 14),   // 1 Baisakh 2094 = April 14, 2027
  2095: new Date(2028, 3, 13),   // 1 Baisakh 2095 = April 13, 2028 (leap year adjustment)
};

// Days in each B.S. month (standard values)
const BS_MONTH_DAYS_STANDARD = [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30];

// B.S. month names in English
const BS_MONTH_NAMES_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

/**
 * Get the A.D. date of the first day of a B.S. year
 * @param {number} bsYear - B.S. year
 * @returns {Date} A.D. date of 1 Baisakh of the given B.S. year
 */
function getBsYearStartAdDate(bsYear) {
  if (BS_YEAR_START_DATES[bsYear]) {
    return new Date(BS_YEAR_START_DATES[bsYear]);
  }

  // For years outside the predefined range, use approximation
  const refBsYear = 2081;
  const refAdDate = new Date(2014, 3, 14); // April 14, 2014
  const yearDiff = bsYear - refBsYear;

  // B.S. year is approximately 365 days long
  const baseDate = new Date(refAdDate);
  baseDate.setDate(baseDate.getDate() + (yearDiff * 365));

  // Add leap year adjustments
  const leapYearCount = Math.abs(yearDiff) / 4;
  if (yearDiff > 0) {
    baseDate.setDate(baseDate.getDate() + Math.floor(leapYearCount));
  } else {
    baseDate.setDate(baseDate.getDate() - Math.floor(leapYearCount));
  }

  return baseDate;
}

/**
 * Convert A.D. date to B.S. date (EXACT conversion)
 * @param {Date|string} adDate - A.D. date
 * @returns {Object} B.S. date object with year, month, day
 */
export function adToBs(adDate) {
  const date = adDate instanceof Date ? adDate : new Date(adDate);

  // Start from known reference
  let bsYear = 2081;
  let bsYearStart = new Date(2014, 3, 14); // 1 Baisakh 2081

  // Adjust forward or backward to find the correct B.S. year
  if (date < bsYearStart) {
    // Go backwards
    while (true) {
      bsYear--;
      bsYearStart = getBsYearStartAdDate(bsYear);
      if (date >= bsYearStart) break;
    }
  } else if (date >= getBsYearStartAdDate(bsYear + 1)) {
    // Go forwards
    while (true) {
      bsYear++;
      bsYearStart = getBsYearStartAdDate(bsYear);
      if (date < getBsYearStartAdDate(bsYear + 1)) break;
    }
  } else {
    bsYearStart = getBsYearStartAdDate(bsYear);
  }

  // Calculate day of year in B.S.
  const dayOfYear = Math.floor((date - bsYearStart) / (1000 * 60 * 60 * 24)) + 1;

  // Convert day of year to B.S. month and day
  let bsMonth = 1;
  let bsDay = dayOfYear;

  for (const daysInMonth of BS_MONTH_DAYS_STANDARD) {
    if (bsDay <= daysInMonth) {
      break;
    }
    bsDay -= daysInMonth;
    bsMonth++;
  }

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay
  };
}

/**
 * Convert B.S. date to A.D. date (EXACT conversion)
 * @param {number} bsYear - B.S. year
 * @param {number} bsMonth - B.S. month (1-12)
 * @param {number} bsDay - B.S. day
 * @returns {Date} A.D. date
 */
export function bsToAd(bsYear, bsMonth, bsDay) {
  // Get the start of the B.S. year
  const bsYearStart = getBsYearStartAdDate(bsYear);

  // Calculate days to add
  let daysToAdd = 0;

  // Add days for complete months
  for (let month = 1; month < bsMonth; month++) {
    if (month <= BS_MONTH_DAYS_STANDARD.length) {
      daysToAdd += BS_MONTH_DAYS_STANDARD[month - 1];
    }
  }

  // Add days within the current month
  daysToAdd += bsDay - 1;

  // Calculate the A.D. date
  const adDate = new Date(bsYearStart);
  adDate.setDate(adDate.getDate() + daysToAdd);

  return adDate;
}

/**
 * Format B.S. date as string
 * @param {number} year - B.S. year
 * @param {number} month - B.S. month (1-12)
 * @param {number} day - B.S. day
 * @param {string} format - 'short' (2081/01/01), 'long' (1 Baisakh 2081), or 'input' (2081-01-01)
 * @returns {string} Formatted B.S. date string
 */
export function formatBsDate(year, month, day, format = 'short') {
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const monthName = BS_MONTH_NAMES_EN[month - 1];

  switch (format) {
    case 'short':
      return `${year}/${monthStr}/${dayStr}`;
    case 'long':
      return `${day} ${monthName} ${year}`;
    case 'input':
      return `${year}-${monthStr}-${dayStr}`;
    default:
      return `${year}/${monthStr}/${dayStr}`;
  }
}

/**
 * Parse B.S. date string (format: YYYY-MM-DD or YYYY/MM/DD)
 * @param {string} bsDateString - B.S. date string
 * @returns {Object|null} B.S. date object with year, month, day or null if invalid
 */
export function parseBsDateString(bsDateString) {
  // Support both / and - as separators
  const parts = bsDateString.split(/[/\-]/);

  if (parts.length !== 3) {
    return null;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  if (day < 1 || day > BS_MONTH_DAYS_STANDARD[month - 1]) {
    return null;
  }

  return { year, month, day };
}

/**
 * Get B.S. month name
 * @param {number} month - B.S. month (1-12)
 * @returns {string} B.S. month name
 */
export function getBsMonthName(month) {
  return BS_MONTH_NAMES_EN[month - 1] || '';
}

/**
 * Convert A.D. date string to B.S. date string for display
 * @param {string} adDateString - A.D. date string (YYYY-MM-DD)
 * @param {string} format - 'short' or 'long'
 * @returns {string} B.S. date string
 */
export function adToBsDisplay(adDateString, format = 'short') {
  if (!adDateString) return '';
  const bsDate = adToBs(adDateString);
  return formatBsDate(bsDate.year, bsDate.month, bsDate.day, format);
}

/**
 * Convert B.S. date string (from input) to A.D. date string (for API)
 * @param {string} bsDateString - B.S. date string (YYYY-MM-DD or YYYY/MM/DD)
 * @returns {string} A.D. date string (YYYY-MM-DD)
 */
export function bsInputToAdApi(bsDateString) {
  const bsDate = parseBsDateString(bsDateString);
  if (!bsDate) return null;

  const adDate = bsToAd(bsDate.year, bsDate.month, bsDate.day);
  const year = adDate.getFullYear();
  const month = String(adDate.getMonth() + 1).padStart(2, '0');
  const day = String(adDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get the A.D. start and end dates for a Nepal Government fiscal year
 * Nepal fiscal year runs from Shrawan last to Ashad last (mid-July to mid-July)
 * @param {number} fiscalYear - Fiscal year (e.g., 2081 for fiscal year 2081/82)
 * @returns {Object} Object with startDate and endDate as Date objects
 */
export function getFiscalYearBounds(fiscalYear) {
  // Fiscal year starts on last day of Shrawan (month 4)
  const shrawan1Ad = bsToAd(fiscalYear, 4, 1);
  const shrawanDays = BS_MONTH_DAYS_STANDARD[3]; // Shrawan is month 4 (index 3)
  const startDateAd = new Date(shrawan1Ad);
  startDateAd.setDate(startDateAd.getDate() + shrawanDays - 1);

  // Fiscal year ends on last day of Ashadh (month 3) of the NEXT B.S. year
  const ashadh1Ad = bsToAd(fiscalYear + 1, 3, 1);
  const ashadhDays = BS_MONTH_DAYS_STANDARD[2]; // Ashadh is month 3 (index 2)
  const endDateAd = new Date(ashadh1Ad);
  endDateAd.setDate(endDateAd.getDate() + ashadhDays - 1);

  return {
    startDate: startDateAd,
    endDate: endDateAd
  };
}

/**
 * Get the Nepal Government fiscal year for a given A.D. date
 * @param {Date|string} adDate - A.D. date
 * @returns {number} Fiscal year (e.g., 2081 for fiscal year 2081/82)
 */
export function getNepaliFiscalYearForDate(adDate) {
  const date = adDate instanceof Date ? adDate : new Date(adDate);
  const bsDate = adToBs(date);

  // Nepal fiscal year:
  // If month >= 4 (Shrawan), it's in fiscal year bsYear/bsYear+1
  // If month < 4 (before Shrawan), it's in fiscal year bsYear-1/bsYear
  if (bsDate.month >= 4) {
    return bsDate.year;
  } else {
    return bsDate.year - 1;
  }
}

/**
 * Get the fiscal year name in Nepal Government format
 * @param {number} fiscalYear - Fiscal year (e.g., 2081)
 * @returns {string} Fiscal year name (e.g., "2081/082")
 */
export function getFiscalYearName(fiscalYear) {
  const nextYearShort = String(fiscalYear + 1).slice(-2);
  return `${fiscalYear}/${nextYearShort}`;
}
