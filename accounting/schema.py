import graphene
from graphene_django import DjangoObjectType
from graphene_django.converter import convert_django_field
from datetime import datetime, timedelta, date
from django.db.models import Sum, Q, Count, Avg, DecimalField
from decimal import Decimal
from .models import (
    Invoice, InvoiceItem, Payment, TMOFee, TMOTrialReceipt,
    Account, JournalEntry, JournalEntryLine, Ledger, AccountType, NormalBalance,
    JournalEntryStatus, get_trial_balance, get_balance_sheet, get_income_statement, get_ledger,
    create_journal_entry, post_journal_entry,
    Asset, AssetReevaluation,
    Shareholder, ShareHolding, ShareTransaction,
    FiscalYear
)
from students.models import Student, Token, Instructor, Vehicle


# Register custom converter for DecimalField
@convert_django_field.register(DecimalField)
def convert_decimal_field_to_decimal(field, registry=None):
    """Convert Django DecimalField to graphene.Float for proper serialization"""
    return graphene.Float(description=field.help_text, required=not field.null)


class DecimalType(graphene.Scalar):
    """Custom scalar for handling Decimal values in GraphQL"""

    @staticmethod
    def serialize(decimal):
        if decimal is None:
            return None
        return float(decimal)

    @staticmethod
    def parse_value(value):
        return Decimal(str(value))

    @staticmethod
    def parse_literal(ast):
        if isinstance(ast, (int, float)):
            return Decimal(str(ast))
        if isinstance(ast, str):
            return Decimal(ast)
        return None


class InvoiceItemType(DjangoObjectType):
    class Meta:
        model = InvoiceItem
        fields = '__all__'


class PaymentType(DjangoObjectType):
    class Meta:
        model = Payment
        fields = '__all__'


class InvoiceType(DjangoObjectType):
    items_list = graphene.List(InvoiceItemType)
    payments_list = graphene.List(PaymentType)

    class Meta:
        model = Invoice
        fields = '__all__'

    def resolve_items_list(self, info):
        return self.items.all()

    def resolve_payments_list(self, info):
        return self.payments.all()


# TMO Trial Billing Types
class TMOFeeType(DjangoObjectType):
    class Meta:
        model = TMOFee
        fields = '__all__'


class TMOTrialReceiptType(DjangoObjectType):
    class Meta:
        model = TMOTrialReceipt
        fields = '__all__'


# Asset Management Types
class AssetReevaluationType(DjangoObjectType):
    class Meta:
        model = AssetReevaluation
        fields = '__all__'


class AssetType(DjangoObjectType):
    reevaluation_history = graphene.List(AssetReevaluationType)

    class Meta:
        model = Asset
        fields = '__all__'

    def resolve_reevaluation_history(self, info):
        return self.reevaluation_history.all()


# Shareholder Management Types
class ShareHoldingType(DjangoObjectType):
    class Meta:
        model = ShareHolding
        fields = '__all__'


class ShareTransactionType(DjangoObjectType):
    class Meta:
        model = ShareTransaction
        fields = '__all__'


class FiscalYearType(DjangoObjectType):
    """GraphQL Type for Fiscal Year model"""
    # Explicitly define property fields
    is_current = graphene.Boolean()
    total_revenue = graphene.Float()
    total_expenses = graphene.Float()
    net_income = graphene.Float()

    # B.S. date fields for display
    start_date_bs = graphene.String()
    end_date_bs = graphene.String()
    start_date_bs_long = graphene.String()
    end_date_bs_long = graphene.String()

    class Meta:
        model = FiscalYear
        fields = '__all__'

    def resolve_is_current(self, info):
        return self.is_current

    def resolve_total_revenue(self, info):
        from decimal import Decimal
        value = self.total_revenue
        if value is None:
            return 0.0
        if isinstance(value, Decimal):
            return float(str(value))
        return float(value)

    def resolve_total_expenses(self, info):
        from decimal import Decimal
        value = self.total_expenses
        if value is None:
            return 0.0
        if isinstance(value, Decimal):
            return float(str(value))
        return float(value)

    def resolve_net_income(self, info):
        from decimal import Decimal
        value = self.net_income
        if value is None:
            return 0.0
        if isinstance(value, Decimal):
            return float(str(value))
        return float(value)

    def resolve_start_date_bs(self, info):
        from core.bs_utils import ad_to_bs, format_bs_date
        if self.start_date:
            bs_year, bs_month, bs_day = ad_to_bs(self.start_date)
            return format_bs_date(bs_year, bs_month, bs_day, format_type='short')
        return None

    def resolve_end_date_bs(self, info):
        from core.bs_utils import ad_to_bs, format_bs_date
        if self.end_date:
            bs_year, bs_month, bs_day = ad_to_bs(self.end_date)
            return format_bs_date(bs_year, bs_month, bs_day, format_type='short')
        return None

    def resolve_start_date_bs_long(self, info):
        from core.bs_utils import ad_to_bs, format_bs_date
        if self.start_date:
            bs_year, bs_month, bs_day = ad_to_bs(self.start_date)
            return format_bs_date(bs_year, bs_month, bs_day, format_type='long')
        return None

    def resolve_end_date_bs_long(self, info):
        from core.bs_utils import ad_to_bs, format_bs_date
        if self.end_date:
            bs_year, bs_month, bs_day = ad_to_bs(self.end_date)
            return format_bs_date(bs_year, bs_month, bs_day, format_type='long')
        return None


class ShareholderType(DjangoObjectType):
    share_holdings = graphene.List(ShareHoldingType)
    transactions = graphene.List(ShareTransactionType)

    # Explicitly define property fields
    ownership_percentage = graphene.Float()
    total_shares = graphene.Int()
    total_equity_contribution = graphene.Float()

    class Meta:
        model = Shareholder
        fields = '__all__'

    def resolve_share_holdings(self, info):
        return self.shareholdings.all()

    def resolve_transactions(self, info):
        return self.transactions.all()

    def resolve_ownership_percentage(self, info):
        value = self.ownership_percentage
        if value is None:
            return 0.0
        return float(value)

    def resolve_total_shares(self, info):
        value = self.total_shares
        if value is None:
            return 0
        return int(value)

    def resolve_total_equity_contribution(self, info):
        from decimal import Decimal
        value = self.total_equity_contribution
        if value is None:
            return 0.0
        if isinstance(value, Decimal):
            return float(str(value))
        return float(value)


class ReceivableType(graphene.ObjectType):
    student_id = graphene.ID()
    student_name = graphene.String()
    student_id_number = graphene.String()
    total_due = graphene.Decimal()
    invoices_count = graphene.Int()
    overdue_days = graphene.Int()


class DashboardStatsType(graphene.ObjectType):
    total_students = graphene.Int()
    active_students = graphene.Int()
    total_tokens_today = graphene.Int()
    today_income = graphene.Decimal()
    pending_dues = graphene.Decimal()
    active_instructors = graphene.Int()
    active_vehicles = graphene.Int()


class InstructorPerformanceType(graphene.ObjectType):
    instructor_id = graphene.ID()
    instructor_name = graphene.String()
    total_tokens = graphene.Int()
    completed_tokens = graphene.Int()
    total_hours = graphene.Float()
    average_rating = graphene.Float()
    this_month_tokens = graphene.Int()


class VehicleUtilizationType(graphene.ObjectType):
    vehicle_id = graphene.ID()
    model_name = graphene.String()
    license_plate = graphene.String()
    total_tokens = graphene.Int()
    total_hours = graphene.Float()
    utilization_rate = graphene.Float()
    this_month_tokens = graphene.Int()


# =============================================================================
# DOUBLE ENTRY ACCOUNTING TYPES
# =============================================================================

class AccountTypeType(DjangoObjectType):
    class Meta:
        model = Account
        fields = '__all__'


class JournalEntryLineType(DjangoObjectType):
    class Meta:
        model = JournalEntryLine
        fields = '__all__'


class JournalEntryType(DjangoObjectType):
    lines = graphene.List(JournalEntryLineType)
    is_balanced = graphene.Boolean()

    class Meta:
        model = JournalEntry
        fields = '__all__'

    def resolve_lines(self, info):
        return self.lines.all()

    def resolve_is_balanced(self, info):
        return self.is_balanced()


class LedgerType(DjangoObjectType):
    class Meta:
        model = Ledger
        fields = '__all__'


class TrialBalanceAccountType(graphene.ObjectType):
    account_code = graphene.String()
    account_name = graphene.String()
    account_type = graphene.String()
    debit = graphene.Float()
    credit = graphene.Float()
    balance = graphene.Float()


class TrialBalanceType(graphene.ObjectType):
    as_of_date = graphene.Date()
    accounts = graphene.List(TrialBalanceAccountType)
    total_debit = graphene.Float()
    total_credit = graphene.Float()
    is_balanced = graphene.Boolean()


class BalanceSheetSectionType(graphene.ObjectType):
    items = graphene.List(TrialBalanceAccountType)
    total = graphene.Float()


class BalanceSheetType(graphene.ObjectType):
    as_of_date = graphene.Date()
    assets = graphene.Field(BalanceSheetSectionType)
    liabilities = graphene.Field(BalanceSheetSectionType)
    equity = graphene.Field(BalanceSheetSectionType)
    total_liabilities_equity = graphene.Float()
    is_balanced = graphene.Boolean()


class IncomeStatementSectionType(graphene.ObjectType):
    items = graphene.List(TrialBalanceAccountType)
    total = graphene.Float()


class IncomeStatementType(graphene.ObjectType):
    start_date = graphene.Date()
    end_date = graphene.Date()
    revenue = graphene.Field(IncomeStatementSectionType)
    expenses = graphene.Field(IncomeStatementSectionType)
    net_income = graphene.Float()


class LedgerEntryType(graphene.ObjectType):
    date = graphene.Date()
    particular = graphene.String()
    voucher_type = graphene.String()
    voucher_number = graphene.String()
    debit = graphene.Float()
    credit = graphene.Float()
    balance = graphene.Float()


class AccountLedgerType(graphene.ObjectType):
    account_code = graphene.String()
    account_name = graphene.String()
    account_type = graphene.String()
    current_balance = graphene.Float()
    entries = graphene.List(LedgerEntryType)


class CreateInvoice(graphene.Mutation):
    class Arguments:
        student_id = graphene.ID()
        items = graphene.List(graphene.JSONString)  # List of {description, quantity, unit_price, item_type}
        discount = graphene.Float()
        tax = graphene.Float()
        due_date = graphene.Date()
        notes = graphene.String()

    invoice = graphene.Field(InvoiceType)

    def mutate(self, info, **kwargs):
        student_id = kwargs.get('student_id')
        if not student_id:
            raise Exception('student_id is required')

        student = Student.objects.get(id=student_id)

        invoice = Invoice(
            student=student,
            discount=Decimal(str(kwargs.get('discount', 0))),
            tax=Decimal(str(kwargs.get('tax', 0))),
            due_date=kwargs.get('due_date'),
            notes=kwargs.get('notes')
        )
        invoice.save()

        # Create invoice items
        items_data = kwargs.get('items', [])
        subtotal = Decimal('0')
        for item_data in items_data:
            # Parse JSON string if needed
            if isinstance(item_data, str):
                import json
                item_data = json.loads(item_data)

            item = InvoiceItem(
                invoice=invoice,
                description=item_data.get('description'),
                quantity=item_data.get('quantity', 1),
                unit_price=item_data.get('unit_price'),
                item_type=item_data.get('item_type')
            )
            item.save()
            subtotal += item.amount

        # Update invoice totals
        invoice.subtotal = subtotal
        invoice.total = subtotal + invoice.tax - invoice.discount
        invoice.save()

        return CreateInvoice(invoice=invoice)


class CreateGuestInvoice(graphene.Mutation):
    class Arguments:
        guest_name = graphene.String(required=True)
        guest_address = graphene.String(required=True)
        guest_contact = graphene.String()
        items = graphene.List(graphene.JSONString)  # List of {description, quantity, unit_price, item_type}
        discount = graphene.Float()
        tax = graphene.Float()
        notes = graphene.String()

    invoice = graphene.Field(InvoiceType)

    def mutate(self, info, **kwargs):
        invoice = Invoice(
            student=None,
            is_guest=True,
            guest_name=kwargs.get('guest_name'),
            guest_address=kwargs.get('guest_address'),
            guest_contact=kwargs.get('guest_contact', ''),
            discount=Decimal(str(kwargs.get('discount', 0))),
            tax=Decimal(str(kwargs.get('tax', 0))),
            notes=kwargs.get('notes')
        )
        invoice.save()

        # Create invoice items
        items_data = kwargs.get('items', [])
        subtotal = Decimal('0')
        for item_data in items_data:
            # Parse JSON string if needed
            if isinstance(item_data, str):
                import json
                item_data = json.loads(item_data)

            item = InvoiceItem(
                invoice=invoice,
                description=item_data.get('description'),
                quantity=item_data.get('quantity', 1),
                unit_price=item_data.get('unit_price'),
                item_type=item_data.get('item_type')
            )
            item.save()
            subtotal += item.amount

        # Update invoice totals
        invoice.subtotal = subtotal
        invoice.total = subtotal + invoice.tax - invoice.discount
        invoice.save()

        return CreateGuestInvoice(invoice=invoice)


class CreateGuestInvoiceAndToken(graphene.Mutation):
    class Arguments:
        guest_name = graphene.String(required=True)
        guest_address = graphene.String(required=True)
        guest_contact = graphene.String()
        session_duration_id = graphene.ID(required=True)  # Token duration ID
        session_date = graphene.Date(required=True)
        session_start_time = graphene.String(required=True)  # Format: "HH:MM"
        instructor_id = graphene.ID()
        vehicle_id = graphene.ID()
        amount = graphene.Float(required=True)  # Session fee
        notes = graphene.String()

    invoice = graphene.Field(InvoiceType)
    token = graphene.Field('students.schema.TokenType')

    def mutate(self, info, **kwargs):
        from students.models import Token, TokenDuration, Instructor, Vehicle

        # Create guest invoice first
        invoice = Invoice(
            student=None,
            is_guest=True,
            guest_name=kwargs.get('guest_name'),
            guest_address=kwargs.get('guest_address'),
            guest_contact=kwargs.get('guest_contact', ''),
            subtotal=kwargs.get('amount', 0),
            total=kwargs.get('amount', 0),
            notes=kwargs.get('notes')
        )
        invoice.save()

        # Create invoice item for the session
        duration = TokenDuration.objects.get(id=kwargs.get('session_duration_id'))
        InvoiceItem.objects.create(
            invoice=invoice,
            description=f"Driving Session - {duration.name}",
            quantity=1,
            unit_price=kwargs.get('amount', 0),
            item_type='SESSION_FEE'
        )
        invoice.save()

        # Create token for the session
        from datetime import datetime, timedelta
        start_time = datetime.strptime(kwargs.get('session_start_time'), '%H:%M').time()
        start_dt = datetime.combine(datetime.today(), start_time)
        end_dt = start_dt + timedelta(minutes=duration.minutes)
        end_time = end_dt.time()

        # Create a temporary student record for the guest
        from students.models import Student
        temp_student = Student(
            first_name=kwargs.get('guest_name').split()[0] if kwargs.get('guest_name') else 'Guest',
            last_name=kwargs.get('guest_name').split()[1] if ' ' in kwargs.get('guest_name', '') else 'Customer',
            address=kwargs.get('guest_address', ''),
            contact=kwargs.get('guest_contact', ''),
            citizenship_number='GUEST' + invoice.invoice_number,
            date_of_birth=datetime.now().date(),
            status='COMPLETED',  # Mark as completed since it's a one-time session
            total_purchased_minutes=duration.minutes,
            total_used_minutes=duration.minutes,
        )
        temp_student.save()

        token = Token(
            student=temp_student,
            duration=duration,
            date=kwargs.get('session_date'),
            start_time=start_time,
            end_time=end_time,
            notes=f"Guest session - {invoice.invoice_number}"
        )

        # Assign instructor and vehicle if provided
        if kwargs.get('instructor_id'):
            instructor = Instructor.objects.get(id=kwargs.get('instructor_id'))
            token.instructor = instructor

        if kwargs.get('vehicle_id'):
            vehicle = Vehicle.objects.get(id=kwargs.get('vehicle_id'))
            token.vehicle = vehicle

        token.save()

        return CreateGuestInvoiceAndToken(invoice=invoice, token=token)


class AddPayment(graphene.Mutation):
    class Arguments:
        invoice_id = graphene.ID(required=True)
        amount = graphene.Float(required=True)
        mode = graphene.String()
        transaction_id = graphene.String()
        notes = graphene.String()
        received_by = graphene.String()

    payment = graphene.Field(PaymentType)
    invoice = graphene.Field(InvoiceType)

    def mutate(self, info, **kwargs):
        invoice = Invoice.objects.get(id=kwargs.get('invoice_id'))

        payment = Payment(
            invoice=invoice,
            amount=kwargs.get('amount'),
            mode=kwargs.get('mode', 'CASH'),
            transaction_id=kwargs.get('transaction_id'),
            notes=kwargs.get('notes'),
            received_by=kwargs.get('received_by')
        )
        payment.save()

        # Detect category from invoice items
        category = 'OTHER'
        if invoice.items.exists():
            first_item_type = invoice.items.first().item_type
            if first_item_type == 'COURSE_FEE':
                category = 'ADMISSION'
            elif first_item_type == 'SESSION_FEE':
                category = 'DRIVING_SESSION'
            elif first_item_type == 'LICENSE_FORM':
                category = 'LICENSE_FORM'
            else:
                category = 'OTHER'

        # Refresh invoice from database to get updated amounts
        invoice.refresh_from_db()

        return AddPayment(payment=payment, invoice=invoice)


class UpdateInvoice(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        discount = graphene.Float()
        tax = graphene.Float()
        due_date = graphene.Date()
        status = graphene.String()
        notes = graphene.String()

    invoice = graphene.Field(InvoiceType)

    def mutate(self, info, **kwargs):
        try:
            invoice = Invoice.objects.get(id=kwargs.get('id'))
        except Invoice.DoesNotExist:
            raise Exception('Invoice not found')

        for field, value in kwargs.items():
            if field != 'id':
                setattr(invoice, field, value)

        # Recalculate total
        invoice.save()
        return UpdateInvoice(invoice=invoice)


class DeleteInvoice(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        try:
            invoice = Invoice.objects.get(id=kwargs.get('id'))
            invoice.delete()
            return DeleteInvoice(success=True)
        except Invoice.DoesNotExist:
            return DeleteInvoice(success=False)


class CreateTMOTrialReceipt(graphene.Mutation):
    class Arguments:
        applicant_name = graphene.String(required=True)
        applicant_id = graphene.String(required=True)
        category = graphene.String(required=True)  # TMOFeeCategory
        payment_mode = graphene.String()

    receipt = graphene.Field(TMOTrialReceiptType)

    def mutate(self, info, **kwargs):
        # Get the fee for this category
        try:
            tmo_fee = TMOFee.objects.get(category=kwargs.get('category'), is_active=True)
        except TMOFee.DoesNotExist:
            raise Exception(f'No fee found for category: {kwargs.get("category")}')

        receipt = TMOTrialReceipt(
            applicant_name=kwargs.get('applicant_name'),
            applicant_id=kwargs.get('applicant_id'),
            category=kwargs.get('category'),
            fee_amount=tmo_fee.fee_amount,
            payment_mode=kwargs.get('payment_mode', 'CASH')
        )
        receipt.save()

        return CreateTMOTrialReceipt(receipt=receipt)


# TMO Fee Management Mutations
class CreateTMOFee(graphene.Mutation):
    class Arguments:
        category = graphene.String(required=True)
        fee_amount = graphene.Float(required=True)
        description = graphene.String()

    fee = graphene.Field(TMOFeeType)

    def mutate(self, info, **kwargs):
        fee = TMOFee(
            category=kwargs.get('category'),
            fee_amount=kwargs.get('fee_amount'),
            description=kwargs.get('description', '')
        )
        fee.save()
        return CreateTMOFee(fee=fee)


class UpdateTMOFee(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fee_amount = DecimalType()
        description = graphene.String()
        is_active = graphene.Boolean()

    fee = graphene.Field(TMOFeeType)

    def mutate(self, info, **kwargs):
        try:
            fee = TMOFee.objects.get(id=kwargs.get('id'))
        except TMOFee.DoesNotExist:
            raise Exception('TMO Fee not found')

        for field, value in kwargs.items():
            if field != 'id':
                setattr(fee, field, value)

        fee.save()
        return UpdateTMOFee(fee=fee)


class DeleteTMOFee(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        try:
            fee = TMOFee.objects.get(id=kwargs.get('id'))
            fee.is_active = False
            fee.save()
            return DeleteTMOFee(success=True)
        except TMOFee.DoesNotExist:
            return DeleteTMOFee(success=False)


# =============================================================================
# ASSET MANAGEMENT MUTATIONS
# =============================================================================

class CreateAsset(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        asset_type = graphene.String(required=True)
        description = graphene.String()
        purchase_date = graphene.Date(required=True)
        purchase_price = DecimalType(required=True)
        depreciation_rate = DecimalType()
        useful_life = graphene.Int()
        status = graphene.String()
        location = graphene.String()

    asset = graphene.Field(AssetType)

    def mutate(self, info, **kwargs):
        from django.utils import timezone

        asset = Asset(
            name=kwargs.get('name'),
            asset_type=kwargs.get('asset_type'),
            description=kwargs.get('description'),
            purchase_date=kwargs.get('purchase_date'),
            purchase_price=Decimal(str(kwargs.get('purchase_price'))),
            depreciation_rate=Decimal(str(kwargs.get('depreciation_rate', 0))),
            useful_life=kwargs.get('useful_life', 5),
            status=kwargs.get('status', 'ACTIVE'),
            location=kwargs.get('location')
        )
        asset.save()

        # Create journal entry for asset purchase
        # Debit: Asset Account (e.g., "Vehicles" or "Fixed Assets")
        # Credit: Cash or Bank Account
        purchase_date = kwargs.get('purchase_date')
        purchase_price = Decimal(str(kwargs.get('purchase_price')))

        # Get or create asset account based on asset type
        asset_type_name = kwargs.get('asset_type')
        account_code_mapping = {
            'VEHICLE': '1500',  # Vehicles
            'EQUIPMENT': '1510',  # Equipment
            'FURNITURE': '1520',  # Furniture
            'BUILDING': '1530',  # Buildings
            'LAND': '1540',  # Land
            'ELECTRONICS': '1550',  # Electronics
        }

        asset_account_code = account_code_mapping.get(asset_type_name, '1500')
        asset_account, created = Account.objects.get_or_create(
            code=asset_account_code,
            defaults={
                'name': f"{asset_type_name.title()} - {kwargs.get('name')}",
                'account_type': AccountType.ASSET,
                'normal_balance': NormalBalance.DEBIT
            }
        )

        # Get cash/bank account (assuming code 1000 for Cash)
        cash_account = Account.objects.filter(code='1000').first()
        if cash_account:
            # Create journal entry for asset purchase
            try:
                je = JournalEntry(
                    date=purchase_date,
                    description=f"Purchase of {kwargs.get('name')} ({asset_type_name})",
                    reference_type='ASSET',
                    reference_id=asset.id,
                    status=JournalEntryStatus.POSTED,
                    total_debit=purchase_price,
                    total_credit=purchase_price,
                    posted_at=timezone.now()
                )
                je.save()

                # Debit Asset Account
                JournalEntryLine.objects.create(
                    journal_entry=je,
                    account=asset_account,
                    debit_amount=purchase_price,
                    credit_amount=Decimal('0'),
                    narration=f"Purchase of {kwargs.get('name')}",
                    line_number=1
                )

                # Credit Cash Account
                JournalEntryLine.objects.create(
                    journal_entry=je,
                    account=cash_account,
                    debit_amount=Decimal('0'),
                    credit_amount=purchase_price,
                    narration=f"Payment for {kwargs.get('name')}",
                    line_number=2
                )

                # Create ledger entries
                _create_ledger_entries(je)
            except Exception as e:
                # Log error but don't fail the asset creation
                print(f"Error creating journal entry for asset: {e}")

        return CreateAsset(asset=asset)


class UpdateAsset(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        asset_type = graphene.String()
        description = graphene.String()
        purchase_date = graphene.Date()
        purchase_price = DecimalType()
        depreciation_rate = DecimalType()
        useful_life = graphene.Int()
        status = graphene.String()
        location = graphene.String()

    asset = graphene.Field(AssetType)

    def mutate(self, info, **kwargs):
        try:
            asset = Asset.objects.get(id=kwargs.get('id'))

            if 'name' in kwargs:
                asset.name = kwargs['name']
            if 'asset_type' in kwargs:
                asset.asset_type = kwargs['asset_type']
            if 'description' in kwargs:
                asset.description = kwargs['description']
            if 'purchase_date' in kwargs:
                asset.purchase_date = kwargs['purchase_date']
            if 'purchase_price' in kwargs:
                asset.purchase_price = Decimal(str(kwargs['purchase_price']))
            if 'depreciation_rate' in kwargs:
                asset.depreciation_rate = Decimal(str(kwargs['depreciation_rate']))
            if 'useful_life' in kwargs:
                asset.useful_life = kwargs['useful_life']
            if 'status' in kwargs:
                asset.status = kwargs['status']
            if 'location' in kwargs:
                asset.location = kwargs['location']

            asset.save()
            return UpdateAsset(asset=asset)
        except Asset.DoesNotExist:
            return None


class DeleteAsset(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, **kwargs):
        try:
            asset = Asset.objects.get(id=kwargs.get('id'))
            asset.delete()
            return DeleteAsset(success=True, message="Asset deleted successfully")
        except Asset.DoesNotExist:
            return DeleteAsset(success=False, message="Asset not found")


class ReevaluateAsset(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        new_value = DecimalType(required=True)
        reason = graphene.String(required=True)

    asset = graphene.Field(AssetType)

    def mutate(self, info, **kwargs):
        from django.utils import timezone

        try:
            asset = Asset.objects.get(id=kwargs.get('id'))
            previous_value = asset.current_value
            new_value = Decimal(str(kwargs.get('new_value')))

            # Create reevaluation record
            reevaluation = AssetReevaluation(
                asset=asset,
                previous_value=previous_value,
                new_value=new_value,
                reason=kwargs.get('reason')
            )
            reevaluation.save()

            # Update asset
            asset.current_value = new_value
            asset.reevaluation_date = date.today()
            asset.save()

            # Create journal entry for revaluation
            value_difference = new_value - previous_value

            if value_difference != 0:
                account_code_mapping = {
                    'VEHICLE': '1500',
                    'EQUIPMENT': '1510',
                    'FURNITURE': '1520',
                    'BUILDING': '1530',
                    'LAND': '1540',
                    'ELECTRONICS': '1550',
                }

                asset_account_code = account_code_mapping.get(asset.asset_type, '1500')
                asset_account = Account.objects.filter(code=asset_account_code).first()

                # Get or create Revaluation Reserve account (Equity)
                reserve_account, created = Account.objects.get_or_create(
                    code='3000',
                    defaults={
                        'name': 'Asset Revaluation Reserve',
                        'account_type': AccountType.EQUITY,
                        'normal_balance': NormalBalance.CREDIT
                    }
                )

                if asset_account and reserve_account:
                    try:
                        je = JournalEntry(
                            date=date.today(),
                            description=f"Revaluation of {asset.name} - {kwargs.get('reason')}",
                            reference_type='ASSET_REEVALUATION',
                            reference_id=reevaluation.id,
                            status=JournalEntryStatus.POSTED,
                            total_debit=abs(value_difference),
                            total_credit=abs(value_difference),
                            posted_at=timezone.now()
                        )
                        je.save()

                        if value_difference > 0:
                            # Value increased: Debit Asset, Credit Reserve
                            JournalEntryLine.objects.create(
                                journal_entry=je,
                                account=asset_account,
                                debit_amount=value_difference,
                                credit_amount=Decimal('0'),
                                narration=f"Upward revaluation of {asset.name}",
                                line_number=1
                            )
                            JournalEntryLine.objects.create(
                                journal_entry=je,
                                account=reserve_account,
                                debit_amount=Decimal('0'),
                                credit_amount=value_difference,
                                narration=f"Revaluation reserve for {asset.name}",
                                line_number=2
                            )
                        else:
                            # Value decreased: Credit Asset, Debit Reserve
                            JournalEntryLine.objects.create(
                                journal_entry=je,
                                account=asset_account,
                                debit_amount=Decimal('0'),
                                credit_amount=abs(value_difference),
                                narration=f"Downward revaluation of {asset.name}",
                                line_number=1
                            )
                            JournalEntryLine.objects.create(
                                journal_entry=je,
                                account=reserve_account,
                                debit_amount=abs(value_difference),
                                credit_amount=Decimal('0'),
                                narration=f"Revaluation reserve adjustment for {asset.name}",
                                line_number=2
                            )

                        # Create ledger entries
                        _create_ledger_entries(je)
                    except Exception as e:
                        print(f"Error creating journal entry for revaluation: {e}")

            return ReevaluateAsset(asset=asset)
        except Asset.DoesNotExist:
            return None


# =============================================================================
# SHAREHOLDER MANAGEMENT MUTATIONS
# =============================================================================

class CreateShareholder(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        shareholder_type = graphene.String(required=True)
        contact_person = graphene.String()
        address = graphene.String()
        phone = graphene.String()
        email = graphene.String()
        pan_number = graphene.String()
        date_became_shareholder = graphene.Date(required=True)
        notes = graphene.String()

    shareholder = graphene.Field(ShareholderType)

    def mutate(self, info, **kwargs):
        shareholder = Shareholder(
            name=kwargs.get('name'),
            shareholder_type=kwargs.get('shareholder_type'),
            contact_person=kwargs.get('contact_person'),
            address=kwargs.get('address'),
            phone=kwargs.get('phone'),
            email=kwargs.get('email'),
            pan_number=kwargs.get('pan_number'),
            date_became_shareholder=kwargs.get('date_became_shareholder'),
            notes=kwargs.get('notes')
        )
        shareholder.save()
        return CreateShareholder(shareholder=shareholder)


class UpdateShareholder(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        shareholder_type = graphene.String()
        contact_person = graphene.String()
        address = graphene.String()
        phone = graphene.String()
        email = graphene.String()
        pan_number = graphene.String()
        date_became_shareholder = graphene.Date()
        is_active = graphene.Boolean()
        notes = graphene.String()

    shareholder = graphene.Field(ShareholderType)

    def mutate(self, info, **kwargs):
        try:
            shareholder = Shareholder.objects.get(id=kwargs.get('id'))

            if 'name' in kwargs:
                shareholder.name = kwargs['name']
            if 'shareholder_type' in kwargs:
                shareholder.shareholder_type = kwargs['shareholder_type']
            if 'contact_person' in kwargs:
                shareholder.contact_person = kwargs['contact_person']
            if 'address' in kwargs:
                shareholder.address = kwargs['address']
            if 'phone' in kwargs:
                shareholder.phone = kwargs['phone']
            if 'email' in kwargs:
                shareholder.email = kwargs['email']
            if 'pan_number' in kwargs:
                shareholder.pan_number = kwargs['pan_number']
            if 'date_became_shareholder' in kwargs:
                shareholder.date_became_shareholder = kwargs['date_became_shareholder']
            if 'is_active' in kwargs:
                shareholder.is_active = kwargs['is_active']
            if 'notes' in kwargs:
                shareholder.notes = kwargs['notes']

            shareholder.save()
            return UpdateShareholder(shareholder=shareholder)
        except Shareholder.DoesNotExist:
            return None


class DeleteShareholder(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, **kwargs):
        try:
            shareholder = Shareholder.objects.get(id=kwargs.get('id'))
            shareholder_name = shareholder.name
            shareholder.delete()
            return DeleteShareholder(success=True, message=f"Shareholder {shareholder_name} deleted successfully")
        except Shareholder.DoesNotExist:
            return DeleteShareholder(success=False, message="Shareholder not found")


class AddShareHolding(graphene.Mutation):
    class Arguments:
        shareholder_id = graphene.ID(required=True)
        share_class = graphene.String(required=True)
        number_of_shares = graphene.Int(required=True)
        face_value_per_share = DecimalType(required=True)
        amount_paid = DecimalType(required=True)
        certificate_number = graphene.String()
        issue_date = graphene.Date(required=True)
        is_fully_paid = graphene.Boolean()
        notes = graphene.String()

    share_holding = graphene.Field(ShareHoldingType)

    def mutate(self, info, **kwargs):
        try:
            from .utils import create_double_entry

            shareholder = Shareholder.objects.get(id=kwargs.get('shareholder_id'))
            amount_paid = Decimal(str(kwargs.get('amount_paid')))
            number_of_shares = kwargs.get('number_of_shares')
            face_value_per_share = Decimal(str(kwargs.get('face_value_per_share')))
            issue_date = kwargs.get('issue_date')

            # Calculate face value and premium
            total_face_value = number_of_shares * face_value_per_share
            share_premium = amount_paid - total_face_value

            # Create the share holding record
            holding = ShareHolding(
                shareholder=shareholder,
                share_class=kwargs.get('share_class'),
                number_of_shares=number_of_shares,
                face_value_per_share=face_value_per_share,
                amount_paid=amount_paid,
                certificate_number=kwargs.get('certificate_number'),
                issue_date=issue_date,
                is_fully_paid=kwargs.get('is_fully_paid', True),
                notes=kwargs.get('notes')
            )
            holding.save()

            # Create journal entries for double-entry accounting
            try:
                # Get or create Share Capital account (Equity - Credit)
                share_capital_account = Account.objects.filter(
                    code='3000',  # Owner's Capital/Share Capital
                    is_active=True
                ).first()

                # Get or create Share Premium account (Equity - Credit)
                share_premium_account = Account.objects.filter(
                    account_type=AccountType.EQUITY,
                    name__icontains='share premium',
                    is_active=True
                ).first()

                if not share_premium_account:
                    share_premium_account = Account.objects.create(
                        code='3300',
                        name='Share Premium',
                        account_type=AccountType.EQUITY,
                        normal_balance=NormalBalance.CREDIT
                    )

                # Get Cash/Bank account (Asset - Debit)
                cash_account = Account.objects.filter(
                    code='1000',  # Cash
                    is_active=True
                ).first()

                if share_capital_account and cash_account:
                    # Prepare debit entries (Cash received)
                    debit_entries = [{
                        'account_id': cash_account.id,
                        'amount': amount_paid,
                        'narration': f'Share capital subscription - {shareholder.name} ({number_of_shares} shares)'
                    }]

                    # Prepare credit entries
                    credit_entries = []

                    # Credit Share Capital with face value
                    if total_face_value > 0:
                        credit_entries.append({
                            'account_id': share_capital_account.id,
                            'amount': total_face_value,
                            'narration': f'Share capital - {shareholder.name} ({number_of_shares} shares at {face_value_per_share} each)'
                        })

                    # Credit Share Premium with excess amount
                    if share_premium > 0 and share_premium_account:
                        credit_entries.append({
                            'account_id': share_premium_account.id,
                            'amount': share_premium,
                            'narration': f'Share premium - {shareholder.name} ({number_of_shares} shares)'
                        })

                    # Create journal entry
                    if debit_entries and credit_entries:
                        create_double_entry(
                            debit_accounts=debit_entries,
                            credit_accounts=credit_entries,
                            date=issue_date,
                            description=f'Issue of {number_of_shares} shares to {shareholder.name}',
                            reference_type='ShareHolding',
                            reference_id=holding.id,
                            post=True
                        )
            except Exception as e:
                # Log error but don't fail the share holding creation
                print(f"Warning: Could not create journal entry for share holding: {str(e)}")

            return AddShareHolding(share_holding=holding)
        except Shareholder.DoesNotExist:
            return None


# =============================================================================
# FISCAL YEAR MUTATIONS
# =============================================================================

class CreateFiscalYear(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        start_date = graphene.Date(required=True)
        end_date = graphene.Date(required=True)
        notes = graphene.String()

    fiscal_year = graphene.Field(FiscalYearType)

    def mutate(self, info, **kwargs):
        from django.core.exceptions import ValidationError
        from core.permissions import check_permissions

        # Check permissions - superuser or accounting.manage_fiscal_years
        @check_permissions('accounting.manage_fiscal_years')
        def _create():
            user = info.context.user if hasattr(info.context, 'user') else None

            fiscal_year = FiscalYear(
                name=kwargs.get('name'),
                start_date=kwargs.get('start_date'),
                end_date=kwargs.get('end_date'),
                notes=kwargs.get('notes', ''),
                created_by=user
            )

            try:
                fiscal_year.full_clean()
                fiscal_year.save()
            except ValidationError as e:
                raise Exception(str(e))

            return fiscal_year

        return CreateFiscalYear(fiscal_year=_create())


class UpdateFiscalYear(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        start_date = graphene.Date()
        end_date = graphene.Date()
        notes = graphene.String()

    fiscal_year = graphene.Field(FiscalYearType)

    def mutate(self, info, **kwargs):
        from django.core.exceptions import ValidationError
        from core.permissions import check_permissions

        @check_permissions('accounting.manage_fiscal_years')
        def _update():
            try:
                fiscal_year = FiscalYear.objects.get(id=kwargs.get('id'))
            except FiscalYear.DoesNotExist:
                raise Exception('Fiscal year not found')

            # Don't allow editing closed fiscal years
            if fiscal_year.is_closed:
                raise Exception('Cannot edit a closed fiscal year')

            for field, value in kwargs.items():
                if field != 'id':
                    setattr(fiscal_year, field, value)

            try:
                fiscal_year.full_clean()
                fiscal_year.save()
            except ValidationError as e:
                raise Exception(str(e))

            return fiscal_year

        return UpdateFiscalYear(fiscal_year=_update())


class CloseFiscalYear(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    fiscal_year = graphene.Field(FiscalYearType)

    def mutate(self, info, **kwargs):
        from core.permissions import check_permissions

        @check_permissions('accounting.manage_fiscal_years')
        def _close():
            user = info.context.user if hasattr(info.context, 'user') else None

            try:
                fiscal_year = FiscalYear.objects.get(id=kwargs.get('id'))
            except FiscalYear.DoesNotExist:
                raise Exception('Fiscal year not found')

            try:
                fiscal_year.close(user=user)
            except Exception as e:
                raise Exception(str(e))

            return fiscal_year

        return CloseFiscalYear(fiscal_year=_close())


class DeleteFiscalYear(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        from core.permissions import check_permissions

        @check_permissions('accounting.manage_fiscal_years')
        def _delete():
            try:
                fiscal_year = FiscalYear.objects.get(id=kwargs.get('id'))
            except FiscalYear.DoesNotExist:
                raise Exception('Fiscal year not found')

            # Don't allow deleting closed fiscal years
            if fiscal_year.is_closed:
                raise Exception('Cannot delete a closed fiscal year')

            fiscal_year.delete()
            return True

        return DeleteFiscalYear(success=_delete())


# =============================================================================
# DOUBLE ENTRY ACCOUNTING MUTATIONS
# =============================================================================

class CreateAccount(graphene.Mutation):
    class Arguments:
        code = graphene.String(required=True)
        name = graphene.String(required=True)
        account_type = graphene.String(required=True)
        parent_account_id = graphene.ID()
        description = graphene.String()
        opening_balance = DecimalType()

    account = graphene.Field(AccountTypeType)

    def mutate(self, info, **kwargs):
        account = Account(
            code=kwargs.get('code'),
            name=kwargs.get('name'),
            account_type=kwargs.get('account_type'),
            parent_account_id=kwargs.get('parent_account_id'),
            description=kwargs.get('description', ''),
            opening_balance=kwargs.get('opening_balance', 0)
        )
        account.save()
        return CreateAccount(account=account)


class UpdateAccount(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        description = graphene.String()
        is_active = graphene.Boolean()

    account = graphene.Field(AccountTypeType)

    def mutate(self, info, **kwargs):
        try:
            account = Account.objects.get(id=kwargs.get('id'))
        except Account.DoesNotExist:
            raise Exception('Account not found')

        for field, value in kwargs.items():
            if field != 'id':
                setattr(account, field, value)

        account.save()
        return UpdateAccount(account=account)


class CreateJournalEntryMutation(graphene.Mutation):
    class Arguments:
        date = graphene.Date(required=True)
        description = graphene.String(required=True)
        debit_entries = graphene.List(graphene.JSONString, required=True)  # [{'account_code': '1000', 'amount': 100, 'narration': '...'}]
        credit_entries = graphene.List(graphene.JSONString, required=True)
        reference_type = graphene.String()
        reference_id = graphene.ID()
        auto_post = graphene.Boolean()

    journal_entry = graphene.Field(JournalEntryType)

    def mutate(self, info, **kwargs):
        # Parse JSON strings if needed
        debit_entries = kwargs.get('debit_entries', [])
        credit_entries = kwargs.get('credit_entries', [])

        parsed_debits = []
        for entry in debit_entries:
            if isinstance(entry, str):
                import json
                parsed_debits.append(json.loads(entry))
            else:
                parsed_debits.append(entry)

        parsed_credits = []
        for entry in credit_entries:
            if isinstance(entry, str):
                import json
                parsed_credits.append(json.loads(entry))
            else:
                parsed_credits.append(entry)

        journal_entry = create_journal_entry(
            date=kwargs.get('date'),
            description=kwargs.get('description'),
            debit_entries=parsed_debits,
            credit_entries=parsed_credits,
            reference_type=kwargs.get('reference_type'),
            reference_id=kwargs.get('reference_id'),
            auto_post=kwargs.get('auto_post', True)
        )

        return CreateJournalEntryMutation(journal_entry=journal_entry)


class PostJournalEntryMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    journal_entry = graphene.Field(JournalEntryType)

    def mutate(self, info, **kwargs):
        journal_entry = post_journal_entry(kwargs.get('id'))
        return PostJournalEntryMutation(journal_entry=journal_entry)


class Query(graphene.ObjectType):
    # Invoice & Billing queries
    all_invoices = graphene.List(InvoiceType)
    invoice = graphene.Field(InvoiceType, id=graphene.ID())
    invoices_by_student = graphene.List(InvoiceType, student_id=graphene.ID())
    invoices_by_status = graphene.List(InvoiceType, status=graphene.String())

    # Asset Management queries
    all_assets = graphene.List(AssetType)
    asset = graphene.Field(AssetType, id=graphene.ID())

    # Shareholder Management queries
    all_shareholders = graphene.List(ShareholderType)
    shareholder = graphene.Field(ShareholderType, id=graphene.ID())
    all_share_holdings = graphene.List(ShareHoldingType)
    all_share_transactions = graphene.List(ShareTransactionType)

    # Fiscal Year queries
    all_fiscal_years = graphene.List(FiscalYearType)
    fiscal_year = graphene.Field(FiscalYearType, id=graphene.ID())
    current_fiscal_year = graphene.Field(FiscalYearType)

    # Receivables queries
    all_receivables = graphene.List(ReceivableType)
    overdue_receivables = graphene.List(ReceivableType)
    aging_report = graphene.List(ReceivableType)

    # Dashboard & Analytics queries
    dashboard_stats = graphene.Field(DashboardStatsType)
    instructor_performance = graphene.List(InstructorPerformanceType)
    vehicle_utilization = graphene.List(VehicleUtilizationType)

    # TMO Trial queries
    all_tmo_fees = graphene.List(TMOFeeType)
    all_tmo_receipts = graphene.List(TMOTrialReceiptType)
    tmo_receipt = graphene.Field(TMOTrialReceiptType, id=graphene.ID())

    # Double Entry Accounting queries
    all_accounts = graphene.List(AccountTypeType)
    account = graphene.Field(AccountTypeType, id=graphene.ID())
    accounts_by_type = graphene.List(AccountTypeType, account_type=graphene.String())
    all_journal_entries = graphene.List(JournalEntryType)
    journal_entry = graphene.Field(JournalEntryType, id=graphene.ID())
    journal_entries_by_date = graphene.List(JournalEntryType, start_date=graphene.Date(), end_date=graphene.Date())
    trial_balance = graphene.Field(TrialBalanceType, as_of_date=graphene.Date())
    balance_sheet = graphene.Field(BalanceSheetType, as_of_date=graphene.Date())
    income_statement = graphene.Field(IncomeStatementType, start_date=graphene.Date(), end_date=graphene.Date())
    account_ledger = graphene.Field(AccountLedgerType, account_code=graphene.String(), as_of_date=graphene.Date())
    all_ledger_entries = graphene.List(LedgerType)

    def resolve_all_invoices(root, info, **kwargs):
        return Invoice.objects.all()

    def resolve_invoice(root, info, id):
        try:
            return Invoice.objects.get(id=id)
        except Invoice.DoesNotExist:
            return None

    def resolve_invoices_by_student(root, info, student_id):
        return Invoice.objects.filter(student_id=student_id).order_by('-created_at')

    def resolve_invoices_by_status(root, info, status):
        return Invoice.objects.filter(status=status).order_by('-created_at')

    def resolve_all_assets(root, info, **kwargs):
        return Asset.objects.all().order_by('-purchase_date')

    def resolve_asset(root, info, id):
        try:
            return Asset.objects.get(id=id)
        except Asset.DoesNotExist:
            return None

    def resolve_all_shareholders(root, info, **kwargs):
        return Shareholder.objects.all().order_by('name')

    def resolve_shareholder(root, info, id):
        try:
            return Shareholder.objects.get(id=id)
        except Shareholder.DoesNotExist:
            return None

    def resolve_all_share_holdings(root, info, **kwargs):
        return ShareHolding.objects.select_related('shareholder').all()

    def resolve_all_share_transactions(root, info, **kwargs):
        return ShareTransaction.objects.select_related('shareholder').all()

    def resolve_all_fiscal_years(root, info, **kwargs):
        return FiscalYear.objects.all().order_by('-start_date')

    def resolve_fiscal_year(root, info, id):
        try:
            return FiscalYear.objects.get(id=id)
        except FiscalYear.DoesNotExist:
            return None

    def resolve_current_fiscal_year(root, info, **kwargs):
        from django.utils import timezone
        today = timezone.now().date()
        return FiscalYear.objects.filter(
            start_date__lte=today,
            end_date__gte=today,
            is_closed=False
        ).first()

    def resolve_all_receivables(root, info, **kwargs):
        # Students with pending dues
        students_with_dues = Student.objects.annotate(
            total_due=Sum('invoices__due_amount', filter=Q(invoices__status__in=['SENT', 'PARTIALLY_PAID']))
        ).filter(total_due__gt=0)

        receivables = []
        for student in students_with_dues:
            invoices = student.invoices.filter(status__in=['SENT', 'PARTIALLY_PAID'])
            total_due = sum(inv.due_amount for inv in invoices)

            receivables.append(ReceivableType(
                student_id=student.id,
                student_name=student.full_name,
                student_id_number=student.student_id,
                total_due=total_due,
                invoices_count=invoices.count(),
                overdue_days=0
            ))

        return receivables

    def resolve_overdue_receivables(root, info, **kwargs):
        from django.utils import timezone
        today = timezone.now().date()

        students_with_overdue = Student.objects.filter(
            invoices__due_date__lt=today,
            invoices__status__in=['SENT', 'PARTIALLY_PAID']
        ).distinct().annotate(
            total_due=Sum('invoices__due_amount', filter=Q(invoices__status__in=['SENT', 'PARTIALLY_PAID']))
        ).filter(total_due__gt=0)

        receivables = []
        for student in students_with_overdue:
            invoices = student.invoices.filter(
                due_date__lt=today,
                status__in=['SENT', 'PARTIALLY_PAID']
            )
            total_due = sum(inv.due_amount for inv in invoices)

            # Calculate max overdue days
            max_overdue = max([
                (today - inv.due_date).days for inv in invoices if inv.due_date
            ], default=0)

            receivables.append(ReceivableType(
                student_id=student.id,
                student_name=student.full_name,
                student_id_number=student.student_id,
                total_due=total_due,
                invoices_count=invoices.count(),
                overdue_days=max_overdue
            ))

        return sorted(receivables, key=lambda x: x.overdue_days, reverse=True)

    def resolve_aging_report(root, info, **kwargs):
        from django.utils import timezone
        today = timezone.now().date()

        # Calculate buckets
        buckets = {
            '0-30': [],
            '31-60': [],
            '61-90': [],
            '90+': []
        }

        students_with_dues = Student.objects.filter(
            invoices__due_date__lt=today,
            invoices__status__in=['SENT', 'PARTIALLY_PAID']
        ).distinct()

        for student in students_with_dues:
            invoices = student.invoices.filter(
                due_date__lt=today,
                status__in=['SENT', 'PARTIALLY_PAID']
            )
            total_due = sum(inv.due_amount for inv in invoices)
            max_overdue = max([
                (today - inv.due_date).days for inv in invoices if inv.due_date
            ], default=0)

            receivable = ReceivableType(
                student_id=student.id,
                student_name=student.full_name,
                student_id_number=student.student_id,
                total_due=total_due,
                invoices_count=invoices.count(),
                overdue_days=max_overdue
            )

            if max_overdue <= 30:
                buckets['0-30'].append(receivable)
            elif max_overdue <= 60:
                buckets['31-60'].append(receivable)
            elif max_overdue <= 90:
                buckets['61-90'].append(receivable)
            else:
                buckets['90+'].append(receivable)

        # Combine all buckets
        result = []
        for bucket_receivables in buckets.values():
            result.extend(bucket_receivables)

        return result

    def resolve_dashboard_stats(root, info, **kwargs):
        from django.utils import timezone
        today = timezone.now().date()

        total_students = Student.objects.count()
        active_students = Student.objects.filter(status='ACTIVE').count()
        total_tokens_today = Token.objects.filter(date=today).count()
        # Calculate today's income from journal entries (revenue accounts credit amounts)
        from .models import Account, Ledger
        revenue_accounts = Account.objects.filter(account_type='REVENUE')
        today_income = Ledger.objects.filter(
            account__in=revenue_accounts,
            date=today
        ).aggregate(total=Sum('credit_amount'))['total'] or 0
        pending_dues = Invoice.objects.filter(status__in=['SENT', 'PARTIALLY_PAID']).aggregate(total=Sum('due_amount'))['total'] or 0
        active_instructors = Instructor.objects.filter(is_active=True).count()
        active_vehicles = Vehicle.objects.filter(is_active=True).count()

        return DashboardStatsType(
            total_students=total_students,
            active_students=active_students,
            total_tokens_today=total_tokens_today,
            today_income=today_income,
            pending_dues=pending_dues,
            active_instructors=active_instructors,
            active_vehicles=active_vehicles
        )

    def resolve_instructor_performance(root, info, **kwargs):
        from django.utils import timezone
        from datetime import date
        today = timezone.now().date()
        this_month_start = today.replace(day=1)

        instructors = Instructor.objects.filter(is_active=True)
        performance = []

        for instructor in instructors:
            tokens = Token.objects.filter(instructor=instructor)
            completed_tokens = tokens.filter(status='COMPLETED').count()
            total_tokens = tokens.count()

            # Calculate total hours from completed tokens
            total_hours = 0
            for token in tokens.filter(status='COMPLETED'):
                if token.duration:
                    total_hours += token.duration.minutes / 60

            # This month tokens
            this_month_tokens = tokens.filter(date__gte=this_month_start).count()

            performance.append(InstructorPerformanceType(
                instructor_id=instructor.id,
                instructor_name=instructor.user.get_full_name() or instructor.user.username,
                total_tokens=total_tokens,
                completed_tokens=completed_tokens,
                total_hours=round(total_hours, 2),
                average_rating=0.0,  # Can be enhanced with rating system
                this_month_tokens=this_month_tokens
            ))

        return sorted(performance, key=lambda x: x.completed_tokens, reverse=True)

    def resolve_vehicle_utilization(root, info, **kwargs):
        from django.utils import timezone
        today = timezone.now().date()
        this_month_start = today.replace(day=1)

        vehicles = Vehicle.objects.filter(is_active=True)
        utilization = []

        for vehicle in vehicles:
            tokens = Token.objects.filter(vehicle=vehicle)
            total_tokens = tokens.count()

            # Calculate total hours
            total_hours = 0
            for token in tokens:
                if token.duration:
                    total_hours += token.duration.minutes / 60

            # This month tokens
            this_month_tokens = tokens.filter(date__gte=this_month_start).count()

            # Calculate utilization rate (tokens in last 30 days / potential slots)
            last_30_days_tokens = tokens.filter(date__gte=today - timedelta(days=30)).count()
            # Assume 8 working hours per day, 30 days = 240 hours per vehicle max
            max_hours = 240
            utilization_rate = round((total_hours / max_hours) * 100, 1) if max_hours > 0 else 0

            utilization.append(VehicleUtilizationType(
                vehicle_id=vehicle.id,
                model_name=vehicle.model_name,
                license_plate=vehicle.license_plate,
                total_tokens=total_tokens,
                total_hours=round(total_hours, 2),
                utilization_rate=utilization_rate,
                this_month_tokens=this_month_tokens
            ))

        return sorted(utilization, key=lambda x: x.utilization_rate, reverse=True)

    def resolve_all_tmo_fees(root, info, **kwargs):
        return TMOFee.objects.filter(is_active=True)

    def resolve_all_tmo_receipts(root, info, **kwargs):
        return TMOTrialReceipt.objects.all()

    def resolve_tmo_receipt(root, info, id):
        try:
            return TMOTrialReceipt.objects.get(id=id)
        except TMOTrialReceipt.DoesNotExist:
            return None

    # Double Entry Accounting resolvers
    def resolve_all_accounts(root, info, **kwargs):
        return Account.objects.all()

    def resolve_account(root, info, id):
        try:
            return Account.objects.get(id=id)
        except Account.DoesNotExist:
            return None

    def resolve_accounts_by_type(root, info, account_type):
        return Account.objects.filter(account_type=account_type, is_active=True)

    def resolve_all_journal_entries(root, info, **kwargs):
        return JournalEntry.objects.all()

    def resolve_journal_entry(root, info, id):
        try:
            return JournalEntry.objects.get(id=id)
        except JournalEntry.DoesNotExist:
            return None

    def resolve_journal_entries_by_date(root, info, start_date=None, end_date=None):
        qs = JournalEntry.objects.all()
        if start_date and end_date:
            qs = qs.filter(date__range=[start_date, end_date])
        return qs

    def resolve_trial_balance(root, info, as_of_date=None):
        tb = get_trial_balance(as_of_date)
        return TrialBalanceType(
            as_of_date=tb['as_of_date'],
            accounts=[TrialBalanceAccountType(**acc) for acc in tb['accounts']],
            total_debit=tb['total_debit'],
            total_credit=tb['total_credit'],
            is_balanced=tb['is_balanced']
        )

    def resolve_balance_sheet(root, info, as_of_date=None):
        bs = get_balance_sheet(as_of_date)
        return BalanceSheetType(
            as_of_date=bs['as_of_date'],
            assets=BalanceSheetSectionType(
                items=[TrialBalanceAccountType(**acc) for acc in bs['assets']['items']],
                total=bs['assets']['total']
            ),
            liabilities=BalanceSheetSectionType(
                items=[TrialBalanceAccountType(**acc) for acc in bs['liabilities']['items']],
                total=bs['liabilities']['total']
            ),
            equity=BalanceSheetSectionType(
                items=[TrialBalanceAccountType(**acc) for acc in bs['equity']['items']],
                total=bs['equity']['total']
            ),
            total_liabilities_equity=bs['total_liabilities_equity'],
            is_balanced=bs['is_balanced']
        )

    def resolve_income_statement(root, info, start_date=None, end_date=None):
        if not start_date:
            from datetime import datetime
            start_date = datetime.now().date().replace(day=1)
        if not end_date:
            from datetime import datetime
            end_date = datetime.now().date()

        inc_stmt = get_income_statement(start_date, end_date)
        return IncomeStatementType(
            start_date=inc_stmt['start_date'],
            end_date=inc_stmt['end_date'],
            revenue=IncomeStatementSectionType(
                items=[TrialBalanceAccountType(**acc) for acc in inc_stmt['revenue']['items']],
                total=inc_stmt['revenue']['total']
            ),
            expenses=IncomeStatementSectionType(
                items=[TrialBalanceAccountType(**acc) for acc in inc_stmt['expenses']['items']],
                total=inc_stmt['expenses']['total']
            ),
            net_income=inc_stmt['net_income']
        )

    def resolve_account_ledger(root, info, account_code, as_of_date=None):
        ledger = get_ledger(account_code, as_of_date)
        return AccountLedgerType(
            account_code=ledger['account_code'],
            account_name=ledger['account_name'],
            account_type=ledger['account_type'],
            current_balance=ledger['current_balance'],
            entries=[LedgerEntryType(**entry) for entry in ledger['entries']]
        )

    def resolve_all_ledger_entries(root, info, **kwargs):
        return Ledger.objects.all()


class Mutation(graphene.ObjectType):
    # Invoice & Payment mutations
    create_invoice = CreateInvoice.Field()
    create_guest_invoice = CreateGuestInvoice.Field()
    create_guest_invoice_and_token = CreateGuestInvoiceAndToken.Field()
    add_payment = AddPayment.Field()
    update_invoice = UpdateInvoice.Field()
    delete_invoice = DeleteInvoice.Field()
    create_tmo_trial_receipt = CreateTMOTrialReceipt.Field()

    # TMO Fee management
    create_tmo_fee = CreateTMOFee.Field()
    update_tmo_fee = UpdateTMOFee.Field()
    delete_tmo_fee = DeleteTMOFee.Field()

    # Asset Management mutations
    create_asset = CreateAsset.Field()
    update_asset = UpdateAsset.Field()
    delete_asset = DeleteAsset.Field()
    reevaluate_asset = ReevaluateAsset.Field()

    # Double Entry Accounting mutations
    create_account = CreateAccount.Field()
    update_account = UpdateAccount.Field()
    create_journal_entry = CreateJournalEntryMutation.Field()
    post_journal_entry = PostJournalEntryMutation.Field()

    # Shareholder Management mutations
    create_shareholder = CreateShareholder.Field()
    update_shareholder = UpdateShareholder.Field()
    delete_shareholder = DeleteShareholder.Field()
    add_share_holding = AddShareHolding.Field()

    # Fiscal Year mutations
    create_fiscal_year = CreateFiscalYear.Field()
    update_fiscal_year = UpdateFiscalYear.Field()
    close_fiscal_year = CloseFiscalYear.Field()
    delete_fiscal_year = DeleteFiscalYear.Field()
