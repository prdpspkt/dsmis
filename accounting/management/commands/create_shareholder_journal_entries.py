from django.core.management.base import BaseCommand
from accounting.models import ShareHolding, Account
from accounting.utils import create_double_entry
from accounting.models import AccountType, NormalBalance
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create journal entries for existing share holdings'

    def handle(self, *args, **options):
        # Get all share holdings
        holdings = ShareHolding.objects.all()

        if not holdings.exists():
            self.stdout.write(self.style.WARNING('No share holdings found'))
            return

        # Get or create required accounts
        share_capital_account = Account.objects.filter(
            code='3000',
            is_active=True
        ).first()

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
            self.stdout.write(self.style.SUCCESS(f'Created Share Premium account'))

        cash_account = Account.objects.filter(
            code='1000',
            is_active=True
        ).first()

        if not share_capital_account:
            self.stdout.write(self.style.ERROR('Share Capital account (code 3000) not found'))
            return

        if not cash_account:
            self.stdout.write(self.style.ERROR('Cash account (code 1000) not found'))
            return

        created_count = 0
        skipped_count = 0

        for holding in holdings:
            # Check if journal entry already exists for this holding
            from accounting.models import JournalEntry
            existing_entry = JournalEntry.objects.filter(
                reference_type='ShareHolding',
                reference_id=holding.id
            ).first()

            if existing_entry:
                skipped_count += 1
                continue

            # Calculate face value and premium
            number_of_shares = holding.number_of_shares
            face_value_per_share = holding.face_value_per_share
            amount_paid = holding.amount_paid

            total_face_value = number_of_shares * face_value_per_share
            share_premium = amount_paid - total_face_value

            # Prepare debit entries (Cash received)
            debit_entries = [{
                'account_id': cash_account.id,
                'amount': amount_paid,
                'narration': f'Share capital subscription - {holding.shareholder.name} ({number_of_shares} shares)'
            }]

            # Prepare credit entries
            credit_entries = []

            # Credit Share Capital with face value
            if total_face_value > 0:
                credit_entries.append({
                    'account_id': share_capital_account.id,
                    'amount': total_face_value,
                    'narration': f'Share capital - {holding.shareholder.name} ({number_of_shares} shares at {face_value_per_share} each)'
                })

            # Credit Share Premium with excess amount
            if share_premium > 0 and share_premium_account:
                credit_entries.append({
                    'account_id': share_premium_account.id,
                    'amount': share_premium,
                    'narration': f'Share premium - {holding.shareholder.name} ({number_of_shares} shares)'
                })

            # Create journal entry
            try:
                create_double_entry(
                    debit_accounts=debit_entries,
                    credit_accounts=credit_entries,
                    date=holding.issue_date,
                    description=f'Issue of {number_of_shares} shares to {holding.shareholder.name}',
                    reference_type='ShareHolding',
                    reference_id=holding.id,
                    post=True
                )
                created_count += 1
                self.stdout.write(
                    f'Created journal entry for {holding.shareholder.name}: '
                    f'{number_of_shares} shares, ₹{amount_paid}'
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to create entry for {holding.shareholder.name}: {str(e)}'
                    )
                )

        self.stdout.write(self.style.SUCCESS(
            f'\nSummary:\n'
            f'  Created: {created_count} journal entries\n'
            f'  Skipped: {skipped_count} (already had entries)\n'
            f'  Total: {holdings.count()} share holdings'
        ))
