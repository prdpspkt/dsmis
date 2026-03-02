"""
Timezone utilities for handling datetime conversions between UTC and Asia/Kathmandu.
"""
from django.conf import settings
from django.utils import timezone
from datetime import datetime
import pytz


def get_app_timezone():
    """
    Get the application timezone (Asia/Kathmandu).
    """
    return pytz.timezone(getattr(settings, 'APP_TIME_ZONE', 'Asia/Kathmandu'))


def to_app_timezone(value):
    """
    Convert a datetime value to application timezone (Asia/Kathmandu).
    If value is naive, assume it's in UTC.

    Args:
        value: datetime object (naive or aware)

    Returns:
        datetime object in Asia/Kathmandu timezone
    """
    if value is None:
        return None

    app_tz = get_app_timezone()

    if timezone.is_aware(value):
        return value.astimezone(app_tz)
    else:
        # Naive datetime, assume UTC
        return pytz.UTC.localize(value).astimezone(app_tz)


def to_utc(value):
    """
    Convert a datetime value to UTC.
    If value is naive, assume it's in Asia/Kathmandu timezone.

    Args:
        value: datetime object (naive or aware)

    Returns:
        datetime object in UTC
    """
    if value is None:
        return None

    app_tz = get_app_timezone()

    if timezone.is_aware(value):
        return value.astimezone(pytz.UTC)
    else:
        # Naive datetime, assume it's in app timezone
        return app_tz.localize(value).astimezone(pytz.UTC)


def get_current_time():
    """
    Get current time in application timezone (Asia/Kathmandu).

    Returns:
        datetime object in Asia/Kathmandu timezone
    """
    return timezone.now().astimezone(get_app_timezone())


def format_datetime(value, format_string='%Y-%m-%d %H:%M:%S %Z'):
    """
    Format a datetime value in application timezone.

    Args:
        value: datetime object
        format_string: strftime format string

    Returns:
        Formatted datetime string
    """
    if value is None:
        return None

    localized = to_app_timezone(value)
    return localized.strftime(format_string)


def format_date(value, format_string='%Y-%m-%d'):
    """
    Format a date value in application timezone.

    Args:
        value: date or datetime object
        format_string: strftime format string

    Returns:
        Formatted date string
    """
    if value is None:
        return None

    if isinstance(value, datetime):
        value = to_app_timezone(value).date()

    return value.strftime(format_string)
