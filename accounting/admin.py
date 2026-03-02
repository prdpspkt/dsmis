from django.contrib import admin
from .models import (
    Invoice, InvoiceItem, Payment, TMOFee, TMOTrialReceipt,
    Account, JournalEntry, JournalEntryLine, Ledger,
    Asset, AssetReevaluation,
    Shareholder, ShareHolding, ShareTransaction,
    FiscalYear
)


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    fields = ('description', 'quantity', 'unit_price', 'item_type')
    readonly_fields = ('amount',)


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = ('amount', 'mode', 'transaction_id', 'payment_date', 'received_by')
    readonly_fields = ('payment_date',)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'student', 'invoice_date', 'total', 'paid_amount', 'due_amount', 'status')
    list_filter = ('status', 'invoice_date')
    search_fields = ('invoice_number', 'student__first_name', 'student__last_name', 'student__student_id')
    readonly_fields = ('invoice_number', 'subtotal', 'total', 'paid_amount', 'due_amount', 'created_at')
    inlines = [InvoiceItemInline, PaymentInline]

    fieldsets = (
        ('Invoice Information', {
            'fields': ('invoice_number', 'student', 'invoice_date', 'due_date', 'status')
        }),
        ('Amounts', {
            'fields': ('subtotal', 'discount', 'tax', 'total', 'paid_amount', 'due_amount')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'description', 'quantity', 'unit_price', 'amount', 'item_type')
    list_filter = ('item_type',)
    search_fields = ('description', 'invoice__invoice_number')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'amount', 'mode', 'payment_date', 'received_by')
    list_filter = ('mode', 'payment_date')
    search_fields = ('invoice__invoice_number', 'transaction_id')


# =============================================================================
# DOUBLE ENTRY ACCOUNTING ADMIN
# =============================================================================

class JournalEntryLineInline(admin.TabularInline):
    model = JournalEntryLine
    extra = 1
    fields = ('account', 'debit_amount', 'credit_amount', 'narration')
    readonly_fields = ('line_number',)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'account_type', 'normal_balance', 'is_active', 'current_balance')
    list_filter = ('account_type', 'is_active', 'normal_balance')
    search_fields = ('code', 'name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'current_balance', 'debit_total', 'credit_total')

    fieldsets = (
        ('Account Information', {
            'fields': ('code', 'name', 'account_type', 'parent_account', 'normal_balance')
        }),
        ('Details', {
            'fields': ('description', 'is_active', 'is_contra', 'opening_balance')
        }),
        ('Balances', {
            'fields': ('current_balance', 'debit_total', 'credit_total'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_number', 'date', 'description', 'total_debit', 'total_credit', 'status', 'created_by')
    list_filter = ('status', 'date', 'reference_type')
    search_fields = ('entry_number', 'description', 'reference_type')
    readonly_fields = ('entry_number', 'total_debit', 'total_credit', 'created_at', 'updated_at', 'posted_at')
    inlines = [JournalEntryLineInline]

    fieldsets = (
        ('Entry Information', {
            'fields': ('entry_number', 'date', 'description', 'status')
        }),
        ('Reference', {
            'fields': ('reference_type', 'reference_id')
        }),
        ('Amounts', {
            'fields': ('total_debit', 'total_credit')
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at', 'updated_at', 'posted_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(JournalEntryLine)
class JournalEntryLineAdmin(admin.ModelAdmin):
    list_display = ('journal_entry', 'account', 'debit_amount', 'credit_amount', 'line_number')
    list_filter = ('account__account_type', 'journal_entry__status')
    search_fields = ('journal_entry__entry_number', 'account__code', 'account__name', 'narration')


@admin.register(Ledger)
class LedgerAdmin(admin.ModelAdmin):
    list_display = ('account', 'date', 'debit_amount', 'credit_amount', 'balance', 'voucher_type', 'voucher_number')
    list_filter = ('account__account_type', 'date', 'voucher_type')
    search_fields = ('account__code', 'account__name', 'particular', 'voucher_number')
    readonly_fields = ('created_at',)

    fieldsets = (
        ('Entry Information', {
            'fields': ('account', 'date', 'particular')
        }),
        ('Amounts', {
            'fields': ('debit_amount', 'credit_amount', 'balance')
        }),
        ('Reference', {
            'fields': ('voucher_type', 'voucher_number', 'journal_entry_line')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(TMOFee)
class TMOFeeAdmin(admin.ModelAdmin):
    list_display = ('category', 'fee_amount', 'is_active', 'effective_from')
    list_filter = ('category', 'is_active')
    search_fields = ('category', 'description')


@admin.register(TMOTrialReceipt)
class TMOTrialReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'applicant_name', 'category', 'fee_amount', 'receipt_date', 'payment_mode')
    list_filter = ('category', 'receipt_date', 'payment_mode')
    search_fields = ('receipt_number', 'applicant_name', 'applicant_id')
    readonly_fields = ('receipt_number', 'receipt_date')


# =============================================================================
# ASSET MANAGEMENT ADMIN
# =============================================================================

class AssetReevaluationInline(admin.TabularInline):
    model = AssetReevaluation
    extra = 0
    readonly_fields = ('reevaluation_date', 'previous_value', 'new_value', 'value_change')
    fields = ('previous_value', 'new_value', 'reason', 'reevaluation_date', 'evaluated_by')


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'asset_type', 'purchase_price', 'current_value', 'depreciation_rate', 'status', 'location', 'purchase_date')
    list_filter = ('asset_type', 'status', 'purchase_date')
    search_fields = ('name', 'description', 'location')
    readonly_fields = ('created_at', 'updated_at', 'age_in_years', 'accumulated_depreciation', 'net_book_value', 'remaining_life')
    inlines = [AssetReevaluationInline]

    fieldsets = (
        ('Asset Information', {
            'fields': ('name', 'asset_type', 'description', 'location', 'status')
        }),
        ('Purchase Details', {
            'fields': ('purchase_date', 'purchase_price', 'current_value')
        }),
        ('Depreciation', {
            'fields': ('depreciation_rate', 'useful_life')
        }),
        ('Reevaluation', {
            'fields': ('reevaluation_date',),
            'classes': ('collapse',)
        }),
        ('Calculated Fields', {
            'fields': ('age_in_years', 'accumulated_depreciation', 'net_book_value', 'remaining_life'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AssetReevaluation)
class AssetReevaluationAdmin(admin.ModelAdmin):
    list_display = ('asset', 'previous_value', 'new_value', 'value_change', 'reevaluation_date', 'evaluated_by')
    list_filter = ('reevaluation_date',)
    search_fields = ('asset__name', 'reason')
    readonly_fields = ('reevaluation_date', 'created_at', 'value_change', 'value_change_percentage')


# =============================================================================
# SHAREHOLDER MANAGEMENT ADMIN
# =============================================================================

class ShareHoldingInline(admin.TabularInline):
    model = ShareHolding
    extra = 0
    fields = ('share_class', 'number_of_shares', 'face_value_per_share', 'amount_paid', 'certificate_number', 'issue_date')
    readonly_fields = ()


@admin.register(Shareholder)
class ShareholderAdmin(admin.ModelAdmin):
    list_display = ('name', 'shareholder_type', 'ownership_percentage', 'total_shares', 'total_equity_contribution', 'pan_number', 'is_active')
    list_filter = ('shareholder_type', 'is_active', 'date_became_shareholder')
    search_fields = ('name', 'pan_number', 'email', 'phone', 'address')
    readonly_fields = ('created_at', 'updated_at', 'ownership_percentage', 'total_shares', 'total_equity_contribution')
    inlines = [ShareHoldingInline]

    fieldsets = (
        ('Shareholder Information', {
            'fields': ('name', 'shareholder_type', 'is_active')
        }),
        ('Contact Details', {
            'fields': ('email', 'phone', 'address')
        }),
        ('Tax Information', {
            'fields': ('pan_number',)
        }),
        ('Investment Summary', {
            'fields': ('ownership_percentage', 'total_shares', 'total_equity_contribution'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('date_became_shareholder',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ShareHolding)
class ShareHoldingAdmin(admin.ModelAdmin):
    list_display = ('shareholder', 'share_class', 'number_of_shares', 'face_value_per_share', 'amount_paid', 'issue_date', 'certificate_number')
    list_filter = ('share_class', 'issue_date')
    search_fields = ('shareholder__name', 'certificate_number')
    readonly_fields = ('created_at',)


@admin.register(ShareTransaction)
class ShareTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'shareholder', 'transaction_type', 'number_of_shares', 'price_per_share', 'total_amount', 'transaction_date')
    list_filter = ('transaction_type', 'transaction_date')
    search_fields = ('shareholder__name', 'notes')
    readonly_fields = ('created_at',)

    fieldsets = (
        ('Transaction Information', {
            'fields': ('shareholder', 'transaction_type')
        }),
        ('Share Details', {
            'fields': ('number_of_shares', 'price_per_share')
        }),
        ('Amounts', {
            'fields': ('total_amount', 'transaction_date')
        }),
        ('Transfer Details', {
            'fields': ('from_shareholder', 'to_shareholder'),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


# =============================================================================
# FISCAL YEAR MANAGEMENT ADMIN
# =============================================================================

@admin.register(FiscalYear)
class FiscalYearAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'is_closed', 'is_current', 'total_revenue', 'total_expenses', 'net_income')
    list_filter = ('is_closed', 'start_date', 'end_date')
    search_fields = ('name', 'notes')
    readonly_fields = ('created_at', 'updated_at', 'is_current', 'total_revenue', 'total_expenses', 'net_income', 'closed_at', 'closed_by')

    fieldsets = (
        ('Fiscal Year Information', {
            'fields': ('name', 'start_date', 'end_date', 'is_closed')
        }),
        ('Financial Summary', {
            'fields': ('total_revenue', 'total_expenses', 'net_income', 'is_current'),
            'classes': ('collapse',)
        }),
        ('Closing Information', {
            'fields': ('closed_at', 'closed_by'),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['close_fiscal_years']

    def close_fiscal_years(self, request, queryset):
        """Admin action to close selected fiscal years"""
        count = 0
        for fiscal_year in queryset.filter(is_closed=False):
            try:
                fiscal_year.close(user=request.user)
                count += 1
            except Exception as e:
                self.message_user(request, f"Error closing {fiscal_year.name}: {str(e)}", level='ERROR')

        if count > 0:
            self.message_user(request, f"Successfully closed {count} fiscal year(s).")

    close_fiscal_years.short_description = "Close selected fiscal years"
