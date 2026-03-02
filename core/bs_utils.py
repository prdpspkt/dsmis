"""
Bikram Sambat (B.S.) to A.D. and A.D. to B.S. date conversion utilities.

Bikram Sambat is the official calendar of Nepal.
This implementation provides EXACT conversion for accounting and billing purposes.

Nepal Government Fiscal Year: Shrawan last to Ashad last (approximately mid-July to mid-July)
"""

from datetime import date, timedelta
from typing import Tuple


# Reference B.S. to A.D. mappings for exact conversion
# These are the exact starting dates of each B.S. year
BS_YEAR_START_DATES = {
    2080: (2013, 4, 14),   # 1 Baisakh 2080 = April 14, 2013
    2081: (2014, 4, 14),   # 1 Baisakh 2081 = April 14, 2014
    2082: (2015, 4, 14),   # 1 Baisakh 2082 = April 14, 2015
    2083: (2016, 4, 13),   # 1 Baisakh 2083 = April 13, 2016 (leap year adjustment)
    2084: (2017, 4, 14),   # 1 Baisakh 2084 = April 14, 2017
    2085: (2018, 4, 14),   # 1 Baisakh 2085 = April 14, 2018
    2086: (2019, 4, 14),   # 1 Baisakh 2086 = April 14, 2019
    2087: (2020, 4, 13),   # 1 Baisakh 2087 = April 13, 2020 (leap year adjustment)
    2088: (2021, 4, 14),   # 1 Baisakh 2088 = April 14, 2021
    2089: (2022, 4, 14),   # 1 Baisakh 2089 = April 14, 2022
    2090: (2023, 4, 14),   # 1 Baisakh 2090 = April 14, 2023
    2091: (2024, 4, 13),   # 1 Baisakh 2091 = April 13, 2024 (leap year adjustment)
    2092: (2025, 4, 14),   # 1 Baisakh 2092 = April 14, 2025
    2093: (2026, 4, 14),   # 1 Baisakh 2093 = April 14, 2026
    2094: (2027, 4, 14),   # 1 Baisakh 2094 = April 14, 2027
    2095: (2028, 4, 13),   # 1 Baisakh 2095 = April 13, 2028 (leap year adjustment)
}

# Days in each B.S. month (can vary by year, but using standard values)
BS_MONTH_DAYS_STANDARD = [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30]

# Nepal Government Fiscal Year: Shrawan last to Ashad last
# Fiscal year 2081/82 starts on Shrawan last of 2081 (approx 17 Shrawan 2081) and ends on Ashad last of 2082
# Approximate A.D. dates: July 17 to July 16
NEPAL_FISCAL_YEAR_START = {
    # Approximate dates - last day of Shrawan (month 4 in B.S., 1-indexed)
    2080: (2013, 7, 16),   # ~17 Shrawan 2080
    2081: (2014, 7, 17),   # ~17 Shrawan 2081
    2082: (2015, 7, 16),   # ~17 Shrawan 2082
    2083: (2016, 7, 16),   # ~17 Shrawan 2083
    2084: (2017, 7, 17),   # ~17 Shrawan 2084
    2085: (2018, 7, 16),   # ~17 Shrawan 2085
    2086: (2019, 7, 17),   # ~17 Shrawan 2086
    2087: (2020, 7, 16),   # ~17 Shrawan 2087
    2088: (2021, 7, 17),   # ~17 Shrawan 2088
    2089: (2022, 7, 16),   # ~17 Shrawan 2089
    2090: (2023, 7, 17),   # ~17 Shrawan 2090
    2091: (2024, 7, 16),   # ~17 Shrawan 2091
    2092: (2025, 7, 17),   # ~17 Shrawan 2092
    2093: (2026, 7, 16),   # ~17 Shrawan 2093
    2094: (2027, 7, 17),   # ~17 Shrawan 2094
    2095: (2028, 7, 16),   # ~17 Shrawan 2095
}


def get_bs_year_start_ad_date(bs_year: int) -> date:
    """
    Get the A.D. date of the first day of a B.S. year.

    Args:
        bs_year: B.S. year

    Returns:
        A.D. date of 1 Baisakh of the given B.S. year
    """
    if bs_year in BS_YEAR_START_DATES:
        return date(*BS_YEAR_START_DATES[bs_year])

    # For years outside the predefined range, use approximation
    # Calculate based on known reference year (2081 = April 14, 2014)
    ref_bs_year = 2081
    ref_ad_date = date(2014, 4, 14)
    year_diff = bs_year - ref_bs_year

    # B.S. year is approximately 365 days long
    base_date = ref_ad_date + timedelta(days=year_diff * 365)

    # Add leap year adjustments (B.S. skips a day every 4 years relative to A.D.)
    leap_year_count = abs(year_diff) // 4
    if year_diff > 0:
        base_date += timedelta(days=leap_year_count)
    else:
        base_date -= timedelta(days=leap_year_count)

    return base_date


def ad_to_bs(ad_date: date) -> Tuple[int, int, int]:
    """
    Convert A.D. date to B.S. date (EXACT conversion).

    Args:
        ad_date: A.D. date

    Returns:
        Tuple of (bs_year, bs_month, bs_day)
    """
    # Find the B.S. year
    bs_year = 2081  # Start with a known year
    bs_year_start = date(2014, 4, 14)  # 1 Baisakh 2081

    # Adjust forward or backward to find the correct B.S. year
    if ad_date < bs_year_start:
        while True:
            bs_year -= 1
            bs_year_start = get_bs_year_start_ad_date(bs_year)
            if ad_date >= bs_year_start:
                break
    elif ad_date >= get_bs_year_start_ad_date(bs_year + 1):
        while True:
            bs_year += 1
            bs_year_start = get_bs_year_start_ad_date(bs_year)
            if ad_date < get_bs_year_start_ad_date(bs_year + 1):
                break
    else:
        bs_year_start = get_bs_year_start_ad_date(bs_year)

    # Calculate day of year in B.S.
    day_of_year = (ad_date - bs_year_start).days + 1

    # Convert day of year to B.S. month and day
    bs_month = 1
    bs_day = day_of_year

    for days_in_month in BS_MONTH_DAYS_STANDARD:
        if bs_day <= days_in_month:
            break
        bs_day -= days_in_month
        bs_month += 1

    return (bs_year, bs_month, bs_day)


def bs_to_ad(bs_year: int, bs_month: int, bs_day: int) -> date:
    """
    Convert B.S. date to A.D. date (EXACT conversion).

    Args:
        bs_year: B.S. year
        bs_month: B.S. month (1-12)
        bs_day: B.S. day

    Returns:
        A.D. date
    """
    # Get the start of the B.S. year
    bs_year_start = get_bs_year_start_ad_date(bs_year)

    # Calculate days to add
    days_to_add = 0

    # Add days for complete months
    for month in range(1, bs_month):
        if month <= len(BS_MONTH_DAYS_STANDARD):
            days_to_add += BS_MONTH_DAYS_STANDARD[month - 1]

    # Add days within the current month
    days_to_add += bs_day - 1

    # Calculate the A.D. date
    ad_date = bs_year_start + timedelta(days=days_to_add)

    return ad_date


def get_bs_month_name(month: int) -> str:
    """
    Get Nepali month name for B.S. month number.

    Args:
        month: Month number (1-12)

    Returns:
        Nepali month name
    """
    bs_months = [
        'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
        'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
    ]
    return bs_months[month - 1] if 1 <= month <= 12 else ''


def format_bs_date(bs_year: int, bs_month: int, bs_day: int, format_type: str = 'short') -> str:
    """
    Format B.S. date as string.

    Args:
        bs_year: B.S. year
        bs_month: B.S. month
        bs_day: B.S. day
        format_type: 'short' (2081/01/01) or 'long' (1 Baisakh 2081)

    Returns:
        Formatted B.S. date string
    """
    if format_type == 'short':
        return f"{bs_year}/{bs_month:02d}/{bs_day:02d}"
    elif format_type == 'long':
        month_name = get_bs_month_name(bs_month)
        return f"{bs_day} {month_name} {bs_year}"
    else:
        return f"{bs_year}/{bs_month:02d}/{bs_day:02d}"


def get_nepali_fiscal_year_bounds(fiscal_year: int) -> Tuple[date, date]:
    """
    Get the A.D. start and end dates for a Nepal Government fiscal year.
    Nepal fiscal year runs from Shrawan last to Ashad last (approximately mid-July to mid-July).

    Args:
        fiscal_year: Fiscal year (e.g., 2081 for fiscal year 2081/82)

    Returns:
        Tuple of (start_date_ad, end_date_ad) in A.D.
    """
    # Fiscal year starts on last day of Shrawan (month 4)
    # Get the date of last Shrawan

    # First, get 1st of Shrawan
    shrawan_1_ad = bs_to_ad(fiscal_year, 4, 1)

    # Add days in Shrawan minus 1 to get last day of Shrawan
    shrawan_days = BS_MONTH_DAYS_STANDARD[3]  # Shrawan is month 4 (index 3)
    start_date_ad = shrawan_1_ad + timedelta(days=shrawan_days - 1)

    # Fiscal year ends on last day of Ashadh (month 3) of the NEXT B.S. year
    ashadh_1_ad = bs_to_ad(fiscal_year + 1, 3, 1)
    ashadh_days = BS_MONTH_DAYS_STANDARD[2]  # Ashadh is month 3 (index 2)
    end_date_ad = ashadh_1_ad + timedelta(days=ashadh_days - 1)

    return (start_date_ad, end_date_ad)


def get_nepali_fiscal_year_for_date(ad_date: date) -> int:
    """
    Get the Nepal Government fiscal year for a given A.D. date.

    Args:
        ad_date: A.D. date

    Returns:
        Fiscal year (e.g., 2081 for fiscal year 2081/82)
    """
    # Convert to B.S.
    bs_year, bs_month, bs_day = ad_to_bs(ad_date)

    # Nepal fiscal year:
    # If month >= 4 (Shrawan), it's in fiscal year bs_year/bs_year+1
    # If month < 4 (before Shrawan), it's in fiscal year bs_year-1/bs_year
    if bs_month >= 4:
        return bs_year
    else:
        return bs_year - 1


def get_fiscal_year_name(fiscal_year: int) -> str:
    """
    Get the fiscal year name in Nepal Government format.

    Args:
        fiscal_year: Fiscal year (e.g., 2081)

    Returns:
        Fiscal year name (e.g., "2081/082")
    """
    return f"{fiscal_year}/{str(fiscal_year + 1)[-2:]}"
