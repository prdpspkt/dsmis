"""
Django signals for automatic journal entry creation
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from decimal import Decimal
from .models import Invoice, Payment, Account, JournalEntry, JournalEntryLine
from .models import create_journal_entry


# Default account codes - these should be configured in settings or a settings model
DEFAULT_ACCOUNTS = {
    'CASH': '1000',           # Cash account
    'BANK': '1100',           # Bank account
    'ACCOUNTS_RECEIVABLE': '1200',  # Student/Student Receivables
    'ADMISSION_REVENUE': '4000',    # Admission Fee Revenue
    'SESSION_REVENUE': '4100',      # Driving Session Revenue
    'LICENSE_REVENUE': '4200',      # License Form Revenue
    'OTHER_REVENUE': '4300',        # Other Income
    'TMO_REVENUE': '4400',          # TMO Trial Revenue
    # Expense accounts
    'SALARY_EXPENSE': '5000',       # Salary & Wages
    'FUEL_EXPENSE': '5100',         # Fuel & Petroleum
    'MAINTENANCE_EXPENSE': '5200',  # Vehicle Maintenance
    'RENT_EXPENSE': '5300',         # Rent
    'UTILITIES_EXPENSE': '5400',    # Utilities
    'OFFICE_SUPPLIES_EXPENSE': '5500',  # Office Supplies
    'INSURANCE_EXPENSE': '5600',    # Insurance
    'TAXES_EXPENSE': '5700',        # Taxes
    'MARKETING_EXPENSE': '5800',    # Marketing
    'VEHICLE_EXPENSE': '5900',      # Vehicle Expense
    'OTHER_EXPENSE': '5999',        # Other Expenses
}


def get_account(code):
    """Get account by code, create if doesn't exist"""
    try:
        return Account.objects.get(code=code)
    except Account.DoesNotExist:
        # Create default account if it doesn't exist
        account_type = 'ASSET'
        if code.startswith('4'):
            account_type = 'REVENUE'
        elif code.startswith('2'):
            account_type = 'LIABILITY'
        elif code.startswith('3'):
            account_type = 'EQUITY'
        elif code.startswith('5'):
            account_type = 'EXPENSE'

        name = code.replace('_', ' ').title()
        return Account.objects.create(
            code=code,
            name=name,
            account_type=account_type
        )


def get_revenue_account(item_type):
    """Get the appropriate revenue account based on item type"""
    mapping = {
        'COURSE_FEE': DEFAULT_ACCOUNTS['ADMISSION_REVENUE'],
        'SESSION_FEE': DEFAULT_ACCOUNTS['SESSION_REVENUE'],
        'LICENSE_FORM': DEFAULT_ACCOUNTS['LICENSE_REVENUE'],
        'TMO_FEE': DEFAULT_ACCOUNTS['TMO_REVENUE'],
    }
    return mapping.get(item_type, DEFAULT_ACCOUNTS['OTHER_REVENUE'])


def get_payment_account(mode):
    """Get the appropriate payment account based on payment mode"""
    if mode == 'CASH':
        return DEFAULT_ACCOUNTS['CASH']
    else:
        return DEFAULT_ACCOUNTS['BANK']


@receiver(post_save, sender=Invoice)
def create_journal_entry_for_invoice(sender, instance, created, **kwargs):
    """
    Create journal entry when an invoice is created/sent
    Debit: Accounts Receivable / Student
    Credit: Revenue
    """
    # Only create journal entry for non-guest invoices that are sent or paid
    if instance.is_guest:
        return

    # Check if journal entry already exists for this invoice
    existing_je = JournalEntry.objects.filter(
        reference_type='INVOICE',
        reference_id=instance.id
    ).first()

    if existing_je:
        return  # Don't create duplicate entries

    # Only create journal entry for SENT or PAID invoices
    if instance.status not in ['SENT', 'PAID', 'PARTIALLY_PAID']:
        return

    # Get invoice items
    items = instance.items.all()
    if not items:
        return

    # Group by revenue account
    revenue_entries = {}
    for item in items:
        revenue_account = get_revenue_account(item.item_type)
        if revenue_account not in revenue_entries:
            revenue_entries[revenue_account] = Decimal('0')
        revenue_entries[revenue_account] += item.amount

    # Create debit entries (Accounts Receivable)
    debit_entries = [{
        'account_code': DEFAULT_ACCOUNTS['ACCOUNTS_RECEIVABLE'],
        'amount': instance.total,
        'narration': f'Invoice {instance.invoice_number} - {instance.student.full_name if instance.student else instance.guest_name}'
    }]

    # Create credit entries (Revenue)
    credit_entries = [
        {
            'account_code': account_code,
            'amount': amount,
            'narration': f'Invoice {instance.invoice_number}'
        }
        for account_code, amount in revenue_entries.items()
    ]

    try:
        create_journal_entry(
            date=instance.invoice_date,
            description=f'Invoice {instance.invoice_number} - {instance.student.full_name if instance.student else instance.guest_name}',
            debit_entries=debit_entries,
            credit_entries=credit_entries,
            reference_type='INVOICE',
            reference_id=instance.id,
            auto_post=True
        )
    except Exception as e:
        # Log error but don't break the invoice creation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create journal entry for invoice {instance.invoice_number}: {str(e)}")


@receiver(post_save, sender=Payment)
def create_journal_entry_for_payment(sender, instance, created, **kwargs):
    """
    Create journal entry when a payment is received
    Debit: Cash/Bank
    Credit: Accounts Receivable / Student
    """
    # Check if journal entry already exists for this payment
    existing_je = JournalEntry.objects.filter(
        reference_type='PAYMENT',
        reference_id=instance.id
    ).first()

    if existing_je:
        return  # Don't create duplicate entries

    # Get payment account (Cash or Bank)
    payment_account = get_payment_account(instance.mode)

    # Create debit entries (Cash/Bank)
    debit_entries = [{
        'account_code': payment_account,
        'amount': instance.amount,
        'narration': f'Payment for {instance.invoice.invoice_number} - {instance.mode}'
    }]

    # Create credit entries (Accounts Receivable)
    credit_entries = [{
        'account_code': DEFAULT_ACCOUNTS['ACCOUNTS_RECEIVABLE'],
        'amount': instance.amount,
        'narration': f'Payment received for {instance.invoice.invoice_number}'
    }]

    try:
        create_journal_entry(
            date=instance.payment_date,
            description=f'Payment received for {instance.invoice.invoice_number} - {instance.mode}',
            debit_entries=debit_entries,
            credit_entries=credit_entries,
            reference_type='PAYMENT',
            reference_id=instance.id,
            auto_post=True
        )
    except Exception as e:
        # Log error but don't break the payment creation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create journal entry for payment {instance.id}: {str(e)}")

