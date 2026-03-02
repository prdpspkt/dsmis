from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.db.models import Sum, Q
from django.contrib.auth import get_user_model
from decimal import Decimal
from students.models import Student

User = get_user_model()


class InvoiceStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SENT = 'SENT', 'Sent'
    PAID = 'PAID', 'Paid'
    PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
    OVERDUE = 'OVERDUE', 'Overdue'
    CANCELLED = 'CANCELLED', 'Cancelled'


class PaymentMode(models.TextChoices):
    CASH = 'CASH', 'Cash'
    BANK = 'BANK', 'Bank Transfer'
    ONLINE = 'ONLINE', 'Online Payment'
    CARD = 'CARD', 'Card'
    UPI = 'UPI', 'UPI'


class Invoice(models.Model):
    invoice_number = models.CharField(max_length=50, unique=True, editable=False)
    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name='invoices', null=True, blank=True)

    # Guest customer fields (for walk-in customers)
    is_guest = models.BooleanField(default=False, help_text="True if this is a guest/walk-in customer")
    guest_name = models.CharField(max_length=200, blank=True, null=True, help_text="Guest customer name")
    guest_address = models.TextField(blank=True, null=True, help_text="Guest customer address")
    guest_contact = models.CharField(max_length=20, blank=True, null=True, help_text="Guest customer contact")

    invoice_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    due_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-created_at']

    def __str__(self):
        if self.is_guest:
            return f"{self.invoice_number} - {self.guest_name} (Guest)"
        return f"{self.invoice_number} - {self.student.full_name}"

    @property
    def customer_name(self):
        """Get customer name (student or guest)"""
        if self.is_guest:
            return self.guest_name
        return self.student.full_name if self.student else 'Unknown'

    @property
    def customer_address(self):
        """Get customer address"""
        if self.is_guest:
            return self.guest_address
        return self.student.address if self.student else ''

    def save(self, *args, **kwargs):
        # Auto-generate invoice number
        if not self.invoice_number:
            from django.utils import timezone
            year_month = timezone.now().strftime('%Y%m')
            prefix = f"INV{year_month}"
            last_invoice = Invoice.objects.filter(invoice_number__startswith=prefix).order_by('-invoice_number').first()
            if last_invoice:
                last_number = int(last_invoice.invoice_number[-4:])
                new_number = last_number + 1
            else:
                new_number = 1
            self.invoice_number = f"{prefix}{new_number:04d}"

        # Calculate due amount
        self.due_amount = self.total - self.paid_amount

        # Auto-update status based on payment
        if self.due_amount <= 0:
            self.status = InvoiceStatus.PAID
        elif self.paid_amount > 0:
            self.status = InvoiceStatus.PARTIALLY_PAID
        else:
            self.status = InvoiceStatus.SENT if self.invoice_number else InvoiceStatus.DRAFT

        super().save(*args, **kwargs)

    @property
    def total_payments(self):
        return self.payments.aggregate(total=models.Sum('amount'))['total'] or 0


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    item_type = models.CharField(max_length=50, blank=True, null=True)  # COURSE_FEE, TOKEN, LICENSE_FORM, etc.

    class Meta:
        db_table = 'invoice_items'
        verbose_name = 'Invoice Item'
        verbose_name_plural = 'Invoice Items'

    def __str__(self):
        return f"{self.description} - {self.amount}"

    def save(self, *args, **kwargs):
        # Calculate amount
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

        # Update invoice subtotal
        if self.invoice:
            subtotal = self.invoice.items.aggregate(total=models.Sum('amount'))['total'] or 0
            self.invoice.subtotal = subtotal
            self.invoice.total = subtotal + self.invoice.tax - self.invoice.discount
            self.invoice.save()


class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    mode = models.CharField(max_length=50, choices=PaymentMode.choices, default=PaymentMode.CASH)
    transaction_id = models.CharField(max_length=200, blank=True, null=True)
    payment_date = models.DateField(auto_now_add=True)
    received_by = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"{self.invoice.invoice_number} - ₹{self.amount}"

    def save(self, *args, **kwargs):
        # First save the payment
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # Update invoice paid_amount after saving payment
        if is_new:
            # Recalculate paid_amount from all payments
            total_paid = self.invoice.payments.aggregate(total=Sum('amount'))['total'] or 0
            self.invoice.paid_amount = total_paid
            self.invoice.save(update_fields=['paid_amount', 'due_amount', 'status'])

    def delete(self, *args, **kwargs):
        invoice = self.invoice
        super().delete(*args, **kwargs)

        # Recalculate paid_amount from remaining payments
        total_paid = invoice.payments.aggregate(total=Sum('amount'))['total'] or 0
        invoice.paid_amount = total_paid
        invoice.save(update_fields=['paid_amount', 'due_amount', 'status'])


# TMO Trial Billing Models
class TMOFeeCategory(models.TextChoices):
    MOTORCYCLE = 'MOTORCYCLE', 'Motorcycle'
    SCOOTER = 'SCOOTER', 'Scooter'
    MOPED = 'MOPED', 'Moped'
    CAR = 'CAR', 'Car (Light Motor Vehicle)'
    HEAVY_VEHICLE = 'HEAVY_VEHICLE', 'Heavy Vehicle'
    TRAILER = 'TRAILER', 'Trailer'


class TMOFee(models.Model):
    category = models.CharField(
        max_length=50,
        choices=TMOFeeCategory.choices,
        unique=True
    )
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    effective_from = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tmo_fees'
        verbose_name = 'TMO Fee'
        verbose_name_plural = 'TMO Fees'
        ordering = ['category']

    def __str__(self):
        return f"{self.get_category_display()} - ₹{self.fee_amount}"


class TMOTrialReceipt(models.Model):
    receipt_number = models.CharField(max_length=50, unique=True, editable=False)
    applicant_name = models.CharField(max_length=200)
    applicant_id = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=TMOFeeCategory.choices)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    receipt_date = models.DateField(auto_now_add=True)
    payment_mode = models.CharField(max_length=50, default='CASH')

    class Meta:
        db_table = 'tmo_trial_receipts'
        verbose_name = 'TMO Trial Receipt'
        verbose_name_plural = 'TMO Trial Receipts'
        ordering = ['-receipt_date', '-id']

    def __str__(self):
        return f"{self.receipt_number} - {self.applicant_name}"

    def save(self, *args, **kwargs):
        # Auto-generate receipt number
        if not self.receipt_number:
            from django.utils import timezone
            year_month = timezone.now().strftime('%Y%m')
            prefix = f"TMO{year_month}"
            last_receipt = TMOTrialReceipt.objects.filter(receipt_number__startswith=prefix).order_by('-receipt_number').first()
            if last_receipt:
                last_number = int(last_receipt.receipt_number[-4:])
                new_number = last_number + 1
            else:
                new_number = 1
            self.receipt_number = f"{prefix}{new_number:04d}"

        super().save(*args, **kwargs)


# =============================================================================
# DOUBLE ENTRY ACCOUNTING SYSTEM
# =============================================================================

class AccountType(models.TextChoices):
    ASSET = 'ASSET', 'Asset'
    LIABILITY = 'LIABILITY', 'Liability'
    EQUITY = 'EQUITY', 'Equity'
    REVENUE = 'REVENUE', 'Revenue'
    EXPENSE = 'EXPENSE', 'Expense'


class NormalBalance(models.TextChoices):
    DEBIT = 'DEBIT', 'Debit'
    CREDIT = 'CREDIT', 'Credit'


class Account(models.Model):
    """
    Chart of Accounts - represents an account in the accounting system
    """
    code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Account code (e.g., 1000 for Cash)"
    )
    name = models.CharField(
        max_length=200,
        help_text="Account name"
    )
    account_type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
        help_text="Type of account"
    )
    parent_account = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='child_accounts',
        help_text="Parent account for hierarchical structure"
    )
    normal_balance = models.CharField(
        max_length=10,
        choices=NormalBalance.choices,
        help_text="Normal balance side for this account"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Account description"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this account is active"
    )
    is_contra = models.BooleanField(
        default=False,
        help_text="Whether this is a contra account"
    )
    opening_balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Opening balance for the account"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts'
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'
        ordering = ['code']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['account_type']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def save(self, *args, **kwargs):
        # Auto-set normal balance based on account type if not set
        if not self.normal_balance:
            if self.account_type in [AccountType.ASSET, AccountType.EXPENSE]:
                self.normal_balance = NormalBalance.DEBIT
            else:
                self.normal_balance = NormalBalance.CREDIT
        super().save(*args, **kwargs)

    @property
    def current_balance(self):
        """Calculate current balance based on journal entries"""
        debit_total = self.journal_lines.filter(
            journal_entry__status='POSTED'
        ).aggregate(Sum('debit_amount'))['debit_amount__sum'] or 0

        credit_total = self.journal_lines.filter(
            journal_entry__status='POSTED'
        ).aggregate(Sum('credit_amount'))['credit_amount__sum'] or 0

        if self.normal_balance == NormalBalance.DEBIT:
            return self.opening_balance + debit_total - credit_total
        else:
            return self.opening_balance + credit_total - debit_total

    @property
    def debit_total(self):
        """Total debits for this account"""
        return self.journal_lines.filter(
            journal_entry__status='POSTED'
        ).aggregate(Sum('debit_amount'))['debit_amount__sum'] or 0

    @property
    def credit_total(self):
        """Total credits for this account"""
        return self.journal_lines.filter(
            journal_entry__status='POSTED'
        ).aggregate(Sum('credit_amount'))['credit_amount__sum'] or 0


class JournalEntryStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    POSTED = 'POSTED', 'Posted'
    CANCELLED = 'CANCELLED', 'Cancelled'


class JournalEntry(models.Model):
    """
    Journal Entry - header for accounting transactions
    """
    entry_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False
    )
    date = models.DateField(
        help_text="Transaction date"
    )
    fiscal_year = models.ForeignKey(
        'FiscalYear',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='journal_entries',
        help_text="Fiscal year for this transaction"
    )
    description = models.TextField(
        help_text="Description of the transaction"
    )
    reference_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Type of reference (Invoice, Payment, etc.)"
    )
    reference_id = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="ID of the referenced object"
    )
    status = models.CharField(
        max_length=20,
        choices=JournalEntryStatus.choices,
        default=JournalEntryStatus.DRAFT
    )
    total_debit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Total debit amount"
    )
    total_credit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Total credit amount"
    )
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='journal_entries'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    posted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the entry was posted"
    )

    class Meta:
        db_table = 'journal_entries'
        verbose_name = 'Journal Entry'
        verbose_name_plural = 'Journal Entries'
        ordering = ['-date', '-entry_number']
        indexes = [
            models.Index(fields=['entry_number']),
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['reference_type', 'reference_id']),
        ]

    def __str__(self):
        return f"{self.entry_number} - {self.description}"

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError

        # Auto-generate entry number
        if not self.entry_number:
            year_month = timezone.now().strftime('%Y%m')
            prefix = f"JE{year_month}"
            last_entry = JournalEntry.objects.filter(
                entry_number__startswith=prefix
            ).order_by('-entry_number').first()
            if last_entry:
                last_number = int(last_entry.entry_number[-4:])
                new_number = last_number + 1
            else:
                new_number = 1
            self.entry_number = f"{prefix}{new_number:04d}"

        # Validate fiscal year is not closed
        if self.fiscal_year and self.fiscal_year.is_closed:
            raise ValidationError(
                f"Cannot create or modify transactions in closed fiscal year {self.fiscal_year.name}"
            )

        # Auto-assign fiscal year if not set
        if not self.fiscal_year:
            fiscal_year = FiscalYear.objects.filter(
                start_date__lte=self.date,
                end_date__gte=self.date,
                is_closed=False
            ).first()

            if fiscal_year:
                self.fiscal_year = fiscal_year
            else:
                # If no matching fiscal year, create a warning but allow save
                import warnings
                warnings.warn(f"No open fiscal year found for date {self.date}. Please create a fiscal year.")

        # Update posted timestamp
        if self.status == JournalEntryStatus.POSTED and not self.posted_at:
            self.posted_at = timezone.now()

        super().save(*args, **kwargs)

    def is_balanced(self):
        """Check if debits equal credits"""
        return self.total_debit == self.total_credit

    @property
    def is_posted(self):
        """Check if entry is posted"""
        return self.status == JournalEntryStatus.POSTED


class JournalEntryLine(models.Model):
    """
    Journal Entry Line - individual debit/credit line items
    """
    journal_entry = models.ForeignKey(
        JournalEntry,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name='journal_lines'
    )
    debit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    credit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    narration = models.TextField(
        blank=True,
        null=True,
        help_text="Description for this line"
    )
    line_number = models.IntegerField(
        default=1
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'journal_entry_lines'
        verbose_name = 'Journal Entry Line'
        verbose_name_plural = 'Journal Entry Lines'
        ordering = ['journal_entry', 'line_number']
        indexes = [
            models.Index(fields=['journal_entry']),
            models.Index(fields=['account']),
        ]

    def __str__(self):
        return f"{self.journal_entry.entry_number} - {self.account.code} - D:{self.debit_amount} C:{self.credit_amount}"

    def clean(self):
        """Validate that either debit or credit is provided, not both"""
        from django.core.exceptions import ValidationError

        if self.debit_amount > 0 and self.credit_amount > 0:
            raise ValidationError("Cannot have both debit and credit amounts")
        if self.debit_amount == 0 and self.credit_amount == 0:
            raise ValidationError("Must have either debit or credit amount")


class Ledger(models.Model):
    """
    Ledger - stores all transactions for each account
    Automatically populated from journal entries
    """
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='ledger_entries'
    )
    date = models.DateField()
    journal_entry_line = models.ForeignKey(
        JournalEntryLine,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ledger_entries'
    )
    particular = models.CharField(
        max_length=500,
        help_text="Description/narration"
    )
    debit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    credit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Running balance after this transaction"
    )
    voucher_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Voucher type (JE, INV, PAY, etc.)"
    )
    voucher_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Voucher reference number"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ledger'
        verbose_name = 'Ledger Entry'
        verbose_name_plural = 'Ledger Entries'
        ordering = ['date', 'id']
        indexes = [
            models.Index(fields=['account']),
            models.Index(fields=['date']),
            models.Index(fields=['voucher_type', 'voucher_number']),
        ]

    def __str__(self):
        return f"{self.account.code} - {self.date} - D:{self.debit_amount} C:{self.credit_amount}"


# =============================================================================
# UTILITY FUNCTIONS FOR DOUBLE ENTRY ACCOUNTING
# =============================================================================

def create_journal_entry(date, description, debit_entries, credit_entries,
                        reference_type=None, reference_id=None, created_by=None, auto_post=True):
    """
    Create a journal entry with automatic balancing and validation

    Args:
        date: Transaction date
        description: Description of the transaction
        debit_entries: List of dicts [{'account_code': '1000', 'amount': 100, 'narration': '...'}, ...]
        credit_entries: List of dicts [{'account_code': '2000', 'amount': 100, 'narration': '...'}, ...]
        reference_type: Related voucher type (e.g., 'INVOICE', 'PAYMENT')
        reference_id: Related voucher ID
        created_by: User who created the entry
        auto_post: Whether to automatically post the entry (default: True)

    Returns:
        JournalEntry object
    """
    from django.core.exceptions import ValidationError

    # Calculate totals
    total_debit = sum(entry['amount'] for entry in debit_entries)
    total_credit = sum(entry['amount'] for entry in credit_entries)

    if total_debit != total_credit:
        raise ValidationError(f"Debit total ({total_debit}) does not equal credit total ({total_credit})")

    if total_debit == 0:
        raise ValidationError("Transaction amount cannot be zero")

    # Create journal entry
    journal_entry = JournalEntry(
        date=date,
        description=description,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
        total_debit=total_debit,
        total_credit=total_credit
    )

    if auto_post:
        journal_entry.status = JournalEntryStatus.POSTED

    journal_entry.save()

    # Create journal entry lines
    line_number = 1

    for entry in debit_entries:
        account = Account.objects.get(code=entry['account_code'])
        JournalEntryLine.objects.create(
            journal_entry=journal_entry,
            account=account,
            debit_amount=entry['amount'],
            credit_amount=0,
            narration=entry.get('narration', ''),
            line_number=line_number
        )
        line_number += 1

    for entry in credit_entries:
        account = Account.objects.get(code=entry['account_code'])
        JournalEntryLine.objects.create(
            journal_entry=journal_entry,
            account=account,
            debit_amount=0,
            credit_amount=entry['amount'],
            narration=entry.get('narration', ''),
            line_number=line_number
        )
        line_number += 1

    # Create ledger entries if posted
    if journal_entry.is_posted:
        _create_ledger_entries(journal_entry)

    return journal_entry


def _create_ledger_entries(journal_entry):
    """
    Create ledger entries from a posted journal entry

    Args:
        journal_entry: JournalEntry instance
    """
    for line in journal_entry.lines.all():
        account = line.account

        # Calculate running balance
        last_balance = Ledger.objects.filter(
            account=account,
            date__lte=journal_entry.date
        ).order_by('-date', '-id').first()

        opening_balance = last_balance.balance if last_balance else account.opening_balance

        if account.normal_balance == NormalBalance.DEBIT:
            running_balance = opening_balance + line.debit_amount - line.credit_amount
        else:
            running_balance = opening_balance + line.credit_amount - line.debit_amount

        # Create ledger entry
        Ledger.objects.create(
            account=account,
            date=journal_entry.date,
            journal_entry_line=line,
            particular=line.narration or journal_entry.description,
            debit_amount=line.debit_amount,
            credit_amount=line.credit_amount,
            balance=running_balance,
            voucher_type=journal_entry.reference_type or 'JE',
            voucher_number=journal_entry.entry_number
        )


def get_trial_balance(as_of_date=None):
    """
    Get trial balance as of a specific date

    Args:
        as_of_date: Date for trial balance (defaults to today)

    Returns:
        Dictionary with debit_total, credit_total, and list of accounts
    """
    from django.utils import timezone

    if as_of_date is None:
        as_of_date = timezone.now().date()

    accounts = Account.objects.filter(is_active=True)

    trial_balance = []
    total_debit = Decimal('0')
    total_credit = Decimal('0')

    for account in accounts:
        balance = account.current_balance

        debit_amount = Decimal('0')
        credit_amount = Decimal('0')

        if balance > 0:
            if account.normal_balance == NormalBalance.DEBIT:
                debit_amount = balance
            else:
                credit_amount = balance
        elif balance < 0:
            # Negative balance - opposite side
            abs_balance = abs(balance)
            if account.normal_balance == NormalBalance.DEBIT:
                credit_amount = abs_balance
            else:
                debit_amount = abs_balance

        if debit_amount > 0 or credit_amount > 0:
            trial_balance.append({
                'account_code': account.code,
                'account_name': account.name,
                'account_type': account.account_type,
                'debit': float(debit_amount),
                'credit': float(credit_amount),
                'balance': float(balance)
            })
            total_debit += debit_amount
            total_credit += credit_amount

    return {
        'as_of_date': as_of_date,
        'accounts': trial_balance,
        'total_debit': float(total_debit),
        'total_credit': float(total_credit),
        'is_balanced': total_debit == total_credit
    }


def get_balance_sheet(as_of_date=None):
    """
    Get balance sheet as of a specific date

    Args:
        as_of_date: Date for balance sheet (defaults to today)

    Returns:
        Dictionary with assets, liabilities, equity totals and details
    """
    from django.utils import timezone
    from django.db.models import Sum

    if as_of_date is None:
        as_of_date = timezone.now().date()

    trial_balance = get_trial_balance(as_of_date)

    assets = []
    liabilities = []
    equity = []

    total_assets = Decimal('0')
    total_liabilities = Decimal('0')
    total_equity = Decimal('0')

    # Calculate net income (revenue - expenses)
    # Get current revenue and expense balances
    revenue_accounts = Account.objects.filter(
        account_type=AccountType.REVENUE,
        is_active=True
    )
    expense_accounts = Account.objects.filter(
        account_type=AccountType.EXPENSE,
        is_active=True
    )

    # Revenue accounts have credit normal balance, so they show positive balance
    total_revenue = Decimal('0')
    for acc in revenue_accounts:
        balance = acc.current_balance
        # Revenue accounts show positive balance when they have credits
        total_revenue += balance

    # Expense accounts have debit normal balance
    total_expenses = Decimal('0')
    for acc in expense_accounts:
        balance = acc.current_balance
        total_expenses += balance

    net_income = total_revenue - total_expenses

    for item in trial_balance['accounts']:
        balance = Decimal(str(item['balance']))

        if item['account_type'] == AccountType.ASSET:
            assets.append(item)
            total_assets += balance
        elif item['account_type'] == AccountType.LIABILITY:
            liabilities.append(item)
            total_liabilities += balance
        elif item['account_type'] == AccountType.EQUITY:
            equity.append(item)
            total_equity += balance

    # Add Net Income (Retained Earnings) to equity
    if net_income != 0:
        equity.append({
            'account_code': 'RETAINED_EARNINGS',
            'account_name': 'Current Earnings (Net Income)',
            'account_type': 'EQUITY',
            'balance': float(net_income)
        })
        total_equity += net_income

    return {
        'as_of_date': as_of_date,
        'assets': {
            'items': assets,
            'total': float(total_assets)
        },
        'liabilities': {
            'items': liabilities,
            'total': float(total_liabilities)
        },
        'equity': {
            'items': equity,
            'total': float(total_equity)
        },
        'total_liabilities_equity': float(total_liabilities + total_equity),
        'is_balanced': abs(total_assets - (total_liabilities + total_equity)) < Decimal('0.01')
    }


def get_income_statement(start_date, end_date):
    """
    Get income statement for a date range

    Args:
        start_date: Start date for the report
        end_date: End date for the report

    Returns:
        Dictionary with revenue, expenses, and net income
    """
    accounts = Account.objects.filter(is_active=True)

    revenue_items = []
    expense_items = []

    total_revenue = Decimal('0')
    total_expenses = Decimal('0')

    for account in accounts:
        if account.account_type == AccountType.REVENUE:
            balance = account.current_balance
            if balance != 0:
                revenue_items.append({
                    'account_code': account.code,
                    'account_name': account.name,
                    'amount': float(abs(balance))
                })
                total_revenue += abs(balance)

        elif account.account_type == AccountType.EXPENSE:
            balance = account.current_balance
            if balance != 0:
                expense_items.append({
                    'account_code': account.code,
                    'account_name': account.name,
                    'amount': float(abs(balance))
                })
                total_expenses += abs(balance)

    net_income = total_revenue - total_expenses

    return {
        'start_date': start_date,
        'end_date': end_date,
        'revenue': {
            'items': revenue_items,
            'total': float(total_revenue)
        },
        'expenses': {
            'items': expense_items,
            'total': float(total_expenses)
        },
        'net_income': float(net_income)
    }


def get_ledger(account_code, as_of_date=None):
    """
    Get ledger for a specific account

    Args:
        account_code: Account code to get ledger for
        as_of_date: Optional date filter (only show entries up to this date)

    Returns:
        List of ledger entries with running balance
    """
    account = Account.objects.get(code=account_code)

    ledger_entries = Ledger.objects.filter(account=account)

    if as_of_date:
        ledger_entries = ledger_entries.filter(date__lte=as_of_date)

    entries = []
    for entry in ledger_entries:
        entries.append({
            'date': entry.date,
            'particular': entry.particular,
            'voucher_type': entry.voucher_type,
            'voucher_number': entry.voucher_number,
            'debit': float(entry.debit_amount),
            'credit': float(entry.credit_amount),
            'balance': float(entry.balance)
        })

    return {
        'account_code': account.code,
        'account_name': account.name,
        'account_type': account.account_type,
        'current_balance': float(account.current_balance),
        'entries': entries
    }


def post_journal_entry(journal_entry_id):
    """
    Post a draft journal entry

    Args:
        journal_entry_id: ID of the journal entry to post

    Returns:
        Updated JournalEntry object
    """
    journal_entry = JournalEntry.objects.get(id=journal_entry_id)

    if journal_entry.is_posted:
        raise ValueError("Journal entry is already posted")

    if not journal_entry.is_balanced():
        raise ValueError("Cannot post unbalanced journal entry")

    journal_entry.status = JournalEntryStatus.POSTED
    journal_entry.save()

    # Create ledger entries
    _create_ledger_entries(journal_entry)

    return journal_entry


# =============================================================================
# ASSET MANAGEMENT MODELS
# =============================================================================

class AssetType(models.TextChoices):
    VEHICLE = 'VEHICLE', 'Vehicle'
    EQUIPMENT = 'EQUIPMENT', 'Equipment'
    FURNITURE = 'FURNITURE', 'Furniture'
    BUILDING = 'BUILDING', 'Building'
    LAND = 'LAND', 'Land'
    ELECTRONICS = 'ELECTRONICS', 'Electronics'
    OTHER = 'OTHER', 'Other'


class AssetStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE', 'Under Maintenance'
    DISPOSED = 'DISPOSED', 'Disposed'


class Asset(models.Model):
    """
    Fixed Asset model for tracking company assets with depreciation
    """
    name = models.CharField(
        max_length=200,
        help_text="Asset name/identifier"
    )
    asset_type = models.CharField(
        max_length=50,
        choices=AssetType.choices,
        help_text="Type of asset"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Detailed description of the asset"
    )
    purchase_date = models.DateField(
        help_text="Date when asset was purchased"
    )
    purchase_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Original purchase price"
    )
    current_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Current value after depreciation"
    )
    depreciation_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Annual depreciation rate in percentage"
    )
    useful_life = models.IntegerField(
        default=5,
        help_text="Useful life in years"
    )
    status = models.CharField(
        max_length=50,
        choices=AssetStatus.choices,
        default=AssetStatus.ACTIVE,
        help_text="Current status of the asset"
    )
    location = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Physical location of the asset"
    )
    reevaluation_date = models.DateField(
        blank=True,
        null=True,
        help_text="Last reevaluation date"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assets'
        verbose_name = 'Asset'
        verbose_name_plural = 'Assets'
        ordering = ['-purchase_date', 'name']
        indexes = [
            models.Index(fields=['asset_type']),
            models.Index(fields=['status']),
            models.Index(fields=['purchase_date']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_asset_type_display()})"

    def save(self, *args, **kwargs):
        # Auto-calculate current value on first save
        if not self.id and self.current_value == 0:
            self.current_value = self.purchase_price
        super().save(*args, **kwargs)

    @property
    def age_in_years(self):
        """Calculate age of asset in years"""
        from django.utils import timezone
        today = timezone.now().date()
        years = today.year - self.purchase_date.year
        if today.month < self.purchase_date.month or (
            today.month == self.purchase_date.month and today.day < self.purchase_date.day
        ):
            years -= 1
        return max(0, years)

    @property
    def accumulated_depreciation(self):
        """Calculate total depreciation"""
        depreciation_amount = (self.purchase_price * (self.depreciation_rate or 0) / 100) * self.age_in_years
        return min(depreciation_amount, self.purchase_price)

    @property
    def net_book_value(self):
        """Calculate net book value (purchase price - accumulated depreciation)"""
        return max(Decimal('0'), self.purchase_price - self.accumulated_depreciation)

    @property
    def remaining_life(self):
        """Calculate remaining useful life"""
        return max(0, self.useful_life - self.age_in_years)


class AssetReevaluation(models.Model):
    """
    Track asset reevaluations and value changes
    """
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='reevaluation_history',
        help_text="Asset being reevaluated"
    )
    previous_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Value before reevaluation"
    )
    new_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Value after reevaluation"
    )
    reevaluation_date = models.DateField(
        auto_now_add=True,
        help_text="Date of reevaluation"
    )
    reason = models.TextField(
        help_text="Reason for reevaluation"
    )
    evaluated_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='asset_reevaluations',
        help_text="User who performed the reevaluation"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'asset_reevaluations'
        verbose_name = 'Asset Reevaluation'
        verbose_name_plural = 'Asset Reevaluations'
        ordering = ['-reevaluation_date', '-created_at']

    def __str__(self):
        return f"{self.asset.name} - {self.previous_value} → {self.new_value}"

    @property
    def value_change(self):
        """Calculate the change in value"""
        return self.new_value - self.previous_value

    @property
    def value_change_percentage(self):
        """Calculate percentage change"""
        if self.previous_value == 0:
            return 0
        return (self.value_change / self.previous_value) * 100


# =============================================================================
# SHAREHOLDER MANAGEMENT MODELS
# =============================================================================

class ShareholderType(models.TextChoices):
    INDIVIDUAL = 'INDIVIDUAL', 'Individual'
    COMPANY = 'COMPANY', 'Company'
    PARTNERSHIP = 'PARTNERSHIP', 'Partnership'
    TRUST = 'TRUST', 'Trust'
    OTHER = 'OTHER', 'Other'


class Shareholder(models.Model):
    """
    Represents a shareholder/investor in the company
    """
    name = models.CharField(
        max_length=200,
        help_text="Full name of the shareholder or company"
    )
    shareholder_type = models.CharField(
        max_length=50,
        choices=ShareholderType.choices,
        default=ShareholderType.INDIVIDUAL,
        help_text="Type of shareholder"
    )
    contact_person = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Contact person for company shareholders"
    )
    address = models.TextField(
        blank=True,
        null=True,
        help_text="Address of the shareholder"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Phone number"
    )
    email = models.EmailField(
        blank=True,
        null=True,
        help_text="Email address"
    )
    pan_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="PAN number for tax purposes"
    )
    date_became_shareholder = models.DateField(
        help_text="Date when this entity became a shareholder"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this shareholder is currently active"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shareholders'
        verbose_name = 'Shareholder'
        verbose_name_plural = 'Shareholders'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_shareholder_type_display()})"

    @property
    def total_shares(self):
        """Calculate total shares held by this shareholder"""
        return self.shareholdings.aggregate(total=models.Sum('number_of_shares'))['total'] or 0

    @property
    def total_equity_contribution(self):
        """Calculate total equity contribution in rupees"""
        return self.shareholdings.aggregate(total=models.Sum('amount_paid'))['total'] or 0

    @property
    def ownership_percentage(self):
        """Calculate ownership percentage of the company"""
        from .utils import get_total_issued_shares
        total_shares = get_total_issued_shares()
        if total_shares > 0:
            return (self.total_shares / total_shares) * 100
        return 0


class ShareClass(models.TextChoices):
    EQUITY = 'EQUITY', 'Equity Shares'
    PREFERENCE = 'PREFERENCE', 'Preference Shares'
    DEBENTURE = 'DEBENTURE', 'Debentures'


class ShareHolding(models.Model):
    """
    Tracks share holdings and capital contributions by shareholders
    """
    shareholder = models.ForeignKey(
        Shareholder,
        on_delete=models.CASCADE,
        related_name='shareholdings',
        help_text="The shareholder who owns these shares"
    )
    share_class = models.CharField(
        max_length=50,
        choices=ShareClass.choices,
        default=ShareClass.EQUITY,
        help_text="Class of shares"
    )
    number_of_shares = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of shares held"
    )
    face_value_per_share = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('10'),
        help_text="Face value per share"
    )
    amount_paid = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Total amount paid for these shares"
    )
    certificate_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Share certificate number"
    )
    issue_date = models.DateField(
        help_text="Date when shares were issued"
    )
    is_fully_paid = models.BooleanField(
        default=True,
        help_text="Whether the shares are fully paid up"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'share_holdings'
        verbose_name = 'Share Holding'
        verbose_name_plural = 'Share Holdings'
        ordering = ['-issue_date', 'shareholder']

    def __str__(self):
        return f"{self.shareholder.name} - {self.number_of_shares} shares"

    @property
    def total_value(self):
        """Calculate total value of holdings"""
        return self.number_of_shares * self.face_value_per_share

    @property
    def amount_due(self):
        """Calculate amount remaining to be paid"""
        return max(Decimal('0'), self.total_value - self.amount_paid)


class ShareTransaction(models.Model):
    """
    Tracks share transactions (buy, sell, transfer)
    """
    TRANSACTION_TYPE = (
        ('PURCHASE', 'Purchase'),
        ('SALE', 'Sale'),
        ('TRANSFER', 'Transfer'),
        ('BONUS', 'Bonus Issue'),
        ('SPLIT', 'Stock Split'),
        ('BUYBACK', 'Buyback'),
    )

    shareholder = models.ForeignKey(
        Shareholder,
        on_delete=models.CASCADE,
        related_name='transactions',
        help_text="Shareholder involved in the transaction"
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE,
        help_text="Type of transaction"
    )
    number_of_shares = models.IntegerField(
        help_text="Number of shares in this transaction"
    )
    price_per_share = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Price per share"
    )
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Total transaction amount"
    )
    transaction_date = models.DateField(
        help_text="Date of transaction"
    )
    from_shareholder = models.ForeignKey(
        Shareholder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transfers_from',
        help_text="For transfers: shareholder transferring shares"
    )
    to_shareholder = models.ForeignKey(
        Shareholder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transfers_to',
        help_text="For transfers: shareholder receiving shares"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Transaction notes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'share_transactions'
        verbose_name = 'Share Transaction'
        verbose_name_plural = 'Share Transactions'
        ordering = ['-transaction_date', '-created_at']

    def __str__(self):
        return f"{self.transaction_type} - {self.number_of_shares} shares - {self.shareholder.name}"


class FiscalYear(models.Model):
    """
    Fiscal Year for accounting with Nepal's fiscal year system.
    Nepal's fiscal year starts from Shrawan 1 and ends on Ashad last of next year.
    Stores A.D. dates for filtering transactions and displays B.S. dates for reference.
    """
    name = models.CharField(
        max_length=50,
        unique=True,
        help_text="Fiscal year name (e.g., '2081/82', '2082/83')"
    )
    start_date = models.DateField(
        help_text="Start date of fiscal year in A.D. (Shrawan 1 of the year)"
    )
    end_date = models.DateField(
        help_text="End date of fiscal year in A.D. (Ashad last of next year)"
    )
    is_closed = models.BooleanField(
        default=False,
        help_text="Whether the fiscal year is closed and locked"
    )
    closed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when fiscal year was closed"
    )
    closed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='closed_fiscal_years',
        help_text="User who closed the fiscal year"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_fiscal_years',
        help_text="User who created this fiscal year (superuser only)"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes about the fiscal year"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fiscal_years'
        verbose_name = 'Fiscal Year'
        verbose_name_plural = 'Fiscal Years'
        ordering = ['-start_date']

    def __str__(self):
        status = " (Closed)" if self.is_closed else " (Open)"
        return f"{self.name}{status}"

    def clean(self):
        from django.core.exceptions import ValidationError
        # Validate end_date is after start_date
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date")

        # Check for overlapping fiscal years
        overlapping = FiscalYear.objects.filter(
            start_date__lte=self.end_date,
            end_date__gte=self.start_date
        ).exclude(id=self.id)

        if overlapping.exists():
            raise ValidationError("Fiscal year dates overlap with an existing fiscal year")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_current(self):
        """Check if this is the current active fiscal year"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date and not self.is_closed

    @property
    def total_revenue(self):
        """Calculate total revenue for this fiscal year"""
        from django.db.models import Sum
        from .models import Account

        revenue_accounts = Account.objects.filter(
            account_type=AccountType.REVENUE,
            is_active=True
        )

        total = Decimal('0')
        for acc in revenue_accounts:
            # Get ledger entries for this fiscal year
            ledger_entries = Ledger.objects.filter(
                account=acc,
                date__gte=self.start_date,
                date__lte=self.end_date
            )
            credits = ledger_entries.aggregate(Sum('credit_amount'))['credit_amount__sum'] or 0
            debits = ledger_entries.aggregate(Sum('debit_amount'))['debit_amount__sum'] or 0
            total += credits - debits

        return total

    @property
    def total_expenses(self):
        """Calculate total expenses for this fiscal year"""
        from django.db.models import Sum
        from .models import Account

        expense_accounts = Account.objects.filter(
            account_type=AccountType.EXPENSE,
            is_active=True
        )

        total = Decimal('0')
        for acc in expense_accounts:
            # Get ledger entries for this fiscal year
            ledger_entries = Ledger.objects.filter(
                account=acc,
                date__gte=self.start_date,
                date__lte=self.end_date
            )
            debits = ledger_entries.aggregate(Sum('debit_amount'))['debit_amount__sum'] or 0
            credits = ledger_entries.aggregate(Sum('credit_amount'))['credit_amount__sum'] or 0
            total += debits - credits

        return total

    @property
    def net_income(self):
        """Calculate net income for this fiscal year"""
        return self.total_revenue - self.total_expenses

    def close(self, user=None):
        """
        Close the fiscal year and prevent further transactions

        Args:
            user: User who is closing the fiscal year
        """
        from django.core.exceptions import ValidationError
        from django.utils import timezone

        if self.is_closed:
            raise ValidationError(f"Fiscal year {self.name} is already closed")

        # Check if there are any unposted journal entries for this period
        unposted = JournalEntry.objects.filter(
            date__gte=self.start_date,
            date__lte=self.end_date,
            status=JournalEntryStatus.DRAFT
        ).count()

        if unposted > 0:
            raise ValidationError(
                f"Cannot close fiscal year with {unposted} unposted journal entries. "
                "Please post all entries before closing."
            )

        # Mark as closed
        self.is_closed = True
        self.closed_at = timezone.now()
        if user:
            self.closed_by = user
        self.save()

        return True
