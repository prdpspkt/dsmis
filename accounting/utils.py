"""
Double Entry Accounting Utility Functions

This module provides helper functions for creating and managing
double entry accounting transactions.
"""

from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from .models import (
    Account, JournalEntry, JournalEntryLine, Ledger,
    AccountType, NormalBalance, JournalEntryStatus
)


class AccountingError(Exception):
    """Custom exception for accounting errors"""
    pass


def create_double_entry(
    debit_accounts,
    credit_accounts,
    date,
    description,
    reference_type=None,
    reference_id=None,
    created_by=None,
    post=True
):
    """
    Create a double entry journal entry.

    Args:
        debit_accounts: List of dicts [{'account_id': X, 'amount': Y, 'narration': 'Z'}]
        credit_accounts: List of dicts [{'account_id': X, 'amount': Y, 'narration': 'Z'}]
        date: Transaction date
        description: Entry description
        reference_type: Optional reference type (e.g., 'Invoice', 'Payment')
        reference_id: Optional reference ID
        created_by: Optional user who created the entry
        post: Whether to post the entry immediately (default True)

    Returns:
        JournalEntry object

    Raises:
        AccountingError: If debits don't equal credits or validation fails
    """
    # Calculate totals
    total_debit = sum(Decimal(str(item['amount'])) for item in debit_accounts)
    total_credit = sum(Decimal(str(item['amount'])) for item in credit_accounts)

    # Validate debits equal credits
    if total_debit != total_credit:
        raise AccountingError(
            f"Debits ({total_debit}) must equal credits ({total_credit})"
        )

    if total_debit == 0:
        raise AccountingError("Transaction amount cannot be zero")

    # Validate accounts exist and are active
    all_account_ids = [item['account_id'] for item in debit_accounts + credit_accounts]
    accounts = Account.objects.filter(id__in=all_account_ids, is_active=True)

    if accounts.count() != len(all_account_ids):
        raise AccountingError("One or more accounts are invalid or inactive")

    with transaction.atomic():
        # Create journal entry
        journal_entry = JournalEntry.objects.create(
            date=date,
            description=description,
            reference_type=reference_type,
            reference_id=reference_id,
            total_debit=total_debit,
            total_credit=total_credit,
            created_by=created_by,
            status=JournalEntryStatus.POSTED if post else JournalEntryStatus.DRAFT
        )

        # Create debit lines
        for idx, item in enumerate(debit_accounts, start=1):
            account = Account.objects.get(id=item['account_id'])
            JournalEntryLine.objects.create(
                journal_entry=journal_entry,
                account=account,
                debit_amount=Decimal(str(item['amount'])),
                credit_amount=0,
                narration=item.get('narration', ''),
                line_number=idx
            )

        # Create credit lines
        for idx, item in enumerate(credit_accounts, start=len(debit_accounts) + 1):
            account = Account.objects.get(id=item['account_id'])
            JournalEntryLine.objects.create(
                journal_entry=journal_entry,
                account=account,
                debit_amount=0,
                credit_amount=Decimal(str(item['amount'])),
                narration=item.get('narration', ''),
                line_number=idx
            )

        # Update ledger if posting
        if post:
            _update_ledger(journal_entry)

    return journal_entry


def _update_ledger(journal_entry):
    """
    Update ledger entries for a posted journal entry.

    This creates ledger entries for each line in the journal entry
    and calculates running balances.
    """
    for line in journal_entry.lines.all():
        account = line.account

        # Get previous balance for this account
        last_ledger_entry = Ledger.objects.filter(
            account=account,
            date__lte=journal_entry.date
        ).order_by('-date', '-id').first()

        if last_ledger_entry:
            previous_balance = last_ledger_entry.balance
        else:
            previous_balance = account.opening_balance

        # Calculate new balance
        if account.normal_balance == NormalBalance.DEBIT:
            new_balance = previous_balance + line.debit_amount - line.credit_amount
        else:
            new_balance = previous_balance + line.credit_amount - line.debit_amount

        # Create ledger entry
        Ledger.objects.create(
            account=account,
            date=journal_entry.date,
            journal_entry_line=line,
            particular=line.narration or journal_entry.description,
            debit_amount=line.debit_amount,
            credit_amount=line.credit_amount,
            balance=new_balance,
            voucher_type=journal_entry.reference_type or 'JE',
            voucher_number=journal_entry.entry_number
        )


def get_account_balance(account_id, as_of_date=None):
    """
    Get the balance for an account as of a specific date.

    Args:
        account_id: Account ID
        as_of_date: Optional date to get balance as of (defaults to current)

    Returns:
        Decimal representing the account balance
    """
    account = Account.objects.get(id=account_id)

    if as_of_date:
        # Get balance as of specific date
        last_ledger_entry = Ledger.objects.filter(
            account=account,
            date__lte=as_of_date
        ).order_by('-date', '-id').first()

        if last_ledger_entry:
            return last_ledger_entry.balance
        else:
            return account.opening_balance
    else:
        # Get current balance
        return account.current_balance


def generate_trial_balance(as_of_date=None):
    """
    Generate a trial balance report.

    Args:
        as_of_date: Optional date to generate trial balance as of

    Returns:
        Dictionary with trial balance data
    """
    # Get all active accounts
    accounts = Account.objects.filter(is_active=True)

    trial_balance = {
        'as_of_date': as_of_date or timezone.now().date(),
        'accounts': [],
        'total_debit': Decimal('0'),
        'total_credit': Decimal('0'),
    }

    for account in accounts:
        balance = get_account_balance(account.id, as_of_date)

        # Determine debit or credit balance
        if balance > 0:
            if account.normal_balance == NormalBalance.DEBIT:
                debit_amount = balance
                credit_amount = Decimal('0')
            else:
                debit_amount = Decimal('0')
                credit_amount = balance
        else:
            debit_amount = Decimal('0')
            credit_amount = Decimal('0')

        trial_balance['accounts'].append({
            'account_code': account.code,
            'account_name': account.name,
            'account_type': account.account_type,
            'debit': debit_amount,
            'credit': credit_amount,
            'balance': balance
        })

        trial_balance['total_debit'] += debit_amount
        trial_balance['total_credit'] += credit_amount

    return trial_balance


def generate_income_statement(start_date, end_date):
    """
    Generate an income statement for a given period.

    Args:
        start_date: Period start date
        end_date: Period end date

    Returns:
        Dictionary with income statement data
    """
    from django.db.models import Sum
    # Get revenue and expense accounts
    revenue_accounts = Account.objects.filter(
        account_type=AccountType.REVENUE,
        is_active=True
    )

    expense_accounts = Account.objects.filter(
        account_type=AccountType.EXPENSE,
        is_active=True
    )

    total_revenue = Decimal('0')
    revenue_items = []

    for account in revenue_accounts:
        # Calculate revenue for the period
        ledger_entries = Ledger.objects.filter(
            account=account,
            date__range=[start_date, end_date]
        )

        period_revenue = ledger_entries.aggregate(
            total=models.Sum('credit_amount')
        )['total'] or Decimal('0')

        if period_revenue > 0:
            revenue_items.append({
                'account_code': account.code,
                'account_name': account.name,
                'amount': period_revenue
            })
            total_revenue += period_revenue

    total_expenses = Decimal('0')
    expense_items = []

    for account in expense_accounts:
        # Calculate expenses for the period
        ledger_entries = Ledger.objects.filter(
            account=account,
            date__range=[start_date, end_date]
        )

        period_expense = ledger_entries.aggregate(
            total=models.Sum('debit_amount')
        )['total'] or Decimal('0')

        if period_expense > 0:
            expense_items.append({
                'account_code': account.code,
                'account_name': account.name,
                'amount': period_expense
            })
            total_expenses += period_expense

    net_income = total_revenue - total_expenses

    return {
        'start_date': start_date,
        'end_date': end_date,
        'revenue': revenue_items,
        'total_revenue': total_revenue,
        'expenses': expense_items,
        'total_expenses': total_expenses,
        'net_income': net_income
    }


def generate_balance_sheet(as_of_date):
    """
    Generate a balance sheet as of a specific date.

    Args:
        as_of_date: Date to generate balance sheet as of

    Returns:
        Dictionary with balance sheet data
    """
    from django.db.models import Sum

    # Get asset accounts
    asset_accounts = Account.objects.filter(
        account_type=AccountType.ASSET,
        is_active=True
    )

    total_assets = Decimal('0')
    asset_items = []

    for account in asset_accounts:
        balance = get_account_balance(account.id, as_of_date)
        if balance != 0:
            asset_items.append({
                'account_code': account.code,
                'account_name': account.name,
                'balance': balance
            })
            total_assets += balance

    # Get liability accounts
    liability_accounts = Account.objects.filter(
        account_type=AccountType.LIABILITY,
        is_active=True
    )

    total_liabilities = Decimal('0')
    liability_items = []

    for account in liability_accounts:
        balance = get_account_balance(account.id, as_of_date)
        if balance != 0:
            liability_items.append({
                'account_code': account.code,
                'account_name': account.name,
                'balance': balance
            })
            total_liabilities += balance

    # Get equity accounts
    equity_accounts = Account.objects.filter(
        account_type=AccountType.EQUITY,
        is_active=True
    )

    total_equity = Decimal('0')
    equity_items = []

    for account in equity_accounts:
        balance = get_account_balance(account.id, as_of_date)
        if balance != 0:
            equity_items.append({
                'account_code': account.code,
                'account_name': account.name,
                'balance': balance
            })
            total_equity += balance

    # Calculate retained earnings (revenue - expenses)
    revenue_balance = Decimal('0')
    expense_balance = Decimal('0')

    revenue_accounts = Account.objects.filter(account_type=AccountType.REVENUE, is_active=True)
    for account in revenue_accounts:
        revenue_balance += get_account_balance(account.id, as_of_date)

    expense_accounts = Account.objects.filter(account_type=AccountType.EXPENSE, is_active=True)
    for account in expense_accounts:
        expense_balance += get_account_balance(account.id, as_of_date)

    retained_earnings = revenue_balance - expense_balance
    total_equity += retained_earnings

    return {
        'as_of_date': as_of_date,
        'assets': asset_items,
        'total_assets': total_assets,
        'liabilities': liability_items,
        'total_liabilities': total_liabilities,
        'equity': equity_items,
        'retained_earnings': retained_earnings,
        'total_equity': total_equity,
        'liabilities_and_equity': total_liabilities + total_equity
    }


def get_account_ledger(account_id, start_date=None, end_date=None):
    """
    Get ledger entries for an account.

    Args:
        account_id: Account ID
        start_date: Optional start date filter
        end_date: Optional end date filter

    Returns:
        List of ledger entries with running balance
    """
    account = Account.objects.get(id=account_id)

    ledger_entries = Ledger.objects.filter(account=account)

    if start_date:
        ledger_entries = ledger_entries.filter(date__gte=start_date)
    if end_date:
        ledger_entries = ledger_entries.filter(date__lte=end_date)

    ledger_entries = ledger_entries.order_by('date', 'id')

    return {
        'account': {
            'code': account.code,
            'name': account.name,
            'type': account.account_type,
        },
        'entries': [
            {
                'date': entry.date,
                'particular': entry.particular,
                'debit': entry.debit_amount,
                'credit': entry.credit_amount,
                'balance': entry.balance,
                'voucher_type': entry.voucher_type,
                'voucher_number': entry.voucher_number,
            }
            for entry in ledger_entries
        ]
    }


# Auto-journal entry functions for business operations

def create_invoice_journal_entry(invoice, created_by=None):
    """
    Create automatic journal entry when an invoice is created.

    Debit: Accounts Receivable (or Cash if paid immediately)
    Credit: Revenue
    """
    from .models import Account

    try:
        # Get default accounts (you may want to make these configurable)
        revenue_account = Account.objects.filter(
            account_type=AccountType.REVENUE,
            is_active=True
        ).first()

        receivable_account = Account.objects.filter(
            account_type=AccountType.ASSET,
            name__icontains='receivable',
            is_active=True
        ).first()

        if not revenue_account or not receivable_account:
            raise AccountingError(
                "Default accounts not configured. Please set up Revenue and Accounts Receivable accounts."
            )

        # Create journal entry
        return create_double_entry(
            debit_accounts=[{
                'account_id': receivable_account.id,
                'amount': invoice.total,
                'narration': f'Invoice {invoice.invoice_number} - {invoice.customer_name}'
            }],
            credit_accounts=[{
                'account_id': revenue_account.id,
                'amount': invoice.total,
                'narration': f'Invoice {invoice.invoice_number} - {invoice.customer_name}'
            }],
            date=invoice.invoice_date,
            description=f'Invoice {invoice.invoice_number}',
            reference_type='Invoice',
            reference_id=invoice.id,
            created_by=created_by
        )
    except Exception as e:
        raise AccountingError(f"Failed to create invoice journal entry: {str(e)}")


def create_payment_journal_entry(payment, created_by=None):
    """
    Create automatic journal entry when a payment is received.

    Debit: Cash/Bank
    Credit: Accounts Receivable
    """
    from .models import Account

    try:
        # Get default accounts
        cash_account = Account.objects.filter(
            account_type=AccountType.ASSET,
            name__icontains='cash',
            is_active=True
        ).first()

        receivable_account = Account.objects.filter(
            account_type=AccountType.ASSET,
            name__icontains='receivable',
            is_active=True
        ).first()

        if not cash_account or not receivable_account:
            raise AccountingError(
                "Default accounts not configured. Please set up Cash and Accounts Receivable accounts."
            )

        # Create journal entry
        return create_double_entry(
            debit_accounts=[{
                'account_id': cash_account.id,
                'amount': payment.amount,
                'narration': f'Payment for {payment.invoice.invoice_number}'
            }],
            credit_accounts=[{
                'account_id': receivable_account.id,
                'amount': payment.amount,
                'narration': f'Payment for {payment.invoice.invoice_number}'
            }],
            date=payment.payment_date,
            description=f'Payment received - {payment.invoice.invoice_number}',
            reference_type='Payment',
            reference_id=payment.id,
            created_by=created_by
        )
    except Exception as e:
        raise AccountingError(f"Failed to create payment journal entry: {str(e)}")


def create_expense_journal_entry(amount, description, expense_account_id, payment_account_id, date, created_by=None):
    """
    Create automatic journal entry for an expense payment.

    Debit: Expense Account
    Credit: Cash/Bank Account
    """
    try:
        return create_double_entry(
            debit_accounts=[{
                'account_id': expense_account_id,
                'amount': amount,
                'narration': description
            }],
            credit_accounts=[{
                'account_id': payment_account_id,
                'amount': amount,
                'narration': description
            }],
            date=date,
            description=description,
            reference_type='Expense',
            created_by=created_by
        )
    except Exception as e:
        raise AccountingError(f"Failed to create expense journal entry: {str(e)}")


def get_total_issued_shares():
    """
    Get the total number of shares issued by the company.

    Returns:
        Integer representing total issued shares
    """
    from .models import ShareHolding
    from django.db.models import Sum

    total = ShareHolding.objects.aggregate(
        total_shares=Sum('number_of_shares')
    )['total_shares'] or 0

    return total


def initialize_chart_of_accounts():
    """
    Initialize a default chart of accounts for a driving school.

    This creates a standard chart of accounts that can be customized later.
    """
    default_accounts = [
        # ASSETS
        {'code': '1000', 'name': 'Cash', 'type': AccountType.ASSET},
        {'code': '1100', 'name': 'Bank Account', 'type': AccountType.ASSET},
        {'code': '1200', 'name': 'Accounts Receivable', 'type': AccountType.ASSET},
        {'code': '1300', 'name': 'Prepaid Expenses', 'type': AccountType.ASSET},
        {'code': '1500', 'name': 'Vehicles', 'type': AccountType.ASSET},
        {'code': '1510', 'name': 'Accumulated Depreciation - Vehicles', 'type': AccountType.ASSET, 'is_contra': True},
        {'code': '1600', 'name': 'Equipment', 'type': AccountType.ASSET},
        {'code': '1610', 'name': 'Accumulated Depreciation - Equipment', 'type': AccountType.ASSET, 'is_contra': True},

        # LIABILITIES
        {'code': '2000', 'name': 'Accounts Payable', 'type': AccountType.LIABILITY},
        {'code': '2100', 'name': 'Accrued Expenses', 'type': AccountType.LIABILITY},
        {'code': '2200', 'name': 'Unearned Revenue', 'type': AccountType.LIABILITY},
        {'code': '2300', 'name': 'Loans Payable', 'type': AccountType.LIABILITY},

        # EQUITY
        {'code': '3000', 'name': 'Owner\'s Capital', 'type': AccountType.EQUITY},
        {'code': '3100', 'name': 'Retained Earnings', 'type': AccountType.EQUITY},
        {'code': '3200', 'name': 'Drawings', 'type': AccountType.EQUITY},

        # REVENUE
        {'code': '4000', 'name': 'Course Fee Revenue', 'type': AccountType.REVENUE},
        {'code': '4100', 'name': 'Driving Session Revenue', 'type': AccountType.REVENUE},
        {'code': '4200', 'name': 'License Form Fee Revenue', 'type': AccountType.REVENUE},
        {'code': '4300', 'name': 'TMO Trial Fee Revenue', 'type': AccountType.REVENUE},
        {'code': '4400', 'name': 'Other Revenue', 'type': AccountType.REVENUE},

        # EXPENSES
        {'code': '5000', 'name': 'Fuel Expenses', 'type': AccountType.EXPENSE},
        {'code': '5100', 'name': 'Vehicle Maintenance', 'type': AccountType.EXPENSE},
        {'code': '5200', 'name': 'Instructor Salaries', 'type': AccountType.EXPENSE},
        {'code': '5300', 'name': 'Rent Expense', 'type': AccountType.EXPENSE},
        {'code': '5400', 'name': 'Utilities Expense', 'type': AccountType.EXPENSE},
        {'code': '5500', 'name': 'Office Supplies', 'type': AccountType.EXPENSE},
        {'code': '5600', 'name': 'Insurance Expense', 'type': AccountType.EXPENSE},
        {'code': '5700', 'name': 'Depreciation Expense', 'type': AccountType.EXPENSE},
        {'code': '5800', 'name': 'License and Permit Fees', 'type': AccountType.EXPENSE},
        {'code': '5900', 'name': 'Other Expenses', 'type': AccountType.EXPENSE},
    ]

    created_accounts = []
    for acc_data in default_accounts:
        is_contra = acc_data.pop('is_contra', False)

        account, created = Account.objects.get_or_create(
            code=acc_data['code'],
            defaults={
                'name': acc_data['name'],
                'account_type': acc_data['type'],
                'is_contra': is_contra
            }
        )

        if created:
            created_accounts.append(account)

    return created_accounts
