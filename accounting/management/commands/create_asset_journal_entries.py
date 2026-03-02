from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
from accounting.models import Asset, Account, JournalEntry, JournalEntryLine, AccountType, NormalBalance, JournalEntryStatus
from accounting.models import _create_ledger_entries


class Command(BaseCommand):
    help = 'Create journal entries for existing assets that don\'t have them'

    def handle(self, *args, **options):
        assets = Asset.objects.all()
        created_count = 0
        skipped_count = 0
        error_count = 0

        # Account code mapping
        account_code_mapping = {
            'VEHICLE': '1500',
            'EQUIPMENT': '1510',
            'FURNITURE': '1520',
            'BUILDING': '1530',
            'LAND': '1540',
            'ELECTRONICS': '1550',
        }

        # Get or create cash account
        cash_account, cash_created = Account.objects.get_or_create(
            code='1000',
            defaults={
                'name': 'Cash',
                'account_type': AccountType.ASSET,
                'normal_balance': NormalBalance.DEBIT,
                'opening_balance': Decimal('1000000')
            }
        )

        self.stdout.write(f"Processing {assets.count()} assets...")

        for asset in assets:
            # Check if journal entry already exists for this asset
            existing_je = JournalEntry.objects.filter(
                reference_type='ASSET',
                reference_id=asset.id
            ).first()

            if existing_je:
                self.stdout.write(f"  Skipping {asset.name} - already has journal entry")
                skipped_count += 1
                continue

            try:
                # Get or create asset account
                asset_account_code = account_code_mapping.get(asset.asset_type, '1500')
                asset_account, created = Account.objects.get_or_create(
                    code=asset_account_code,
                    defaults={
                        'name': f"{asset.asset_type.title()} - {asset.name}",
                        'account_type': AccountType.ASSET,
                        'normal_balance': NormalBalance.DEBIT
                    }
                )

                # Create journal entry
                je = JournalEntry(
                    date=asset.purchase_date,
                    description=f"Purchase of {asset.name} ({asset.asset_type})",
                    reference_type='ASSET',
                    reference_id=asset.id,
                    status=JournalEntryStatus.POSTED,
                    total_debit=asset.purchase_price,
                    total_credit=asset.purchase_price,
                    posted_at=timezone.now()
                )
                je.save()

                # Debit Asset Account
                JournalEntryLine.objects.create(
                    journal_entry=je,
                    account=asset_account,
                    debit_amount=asset.purchase_price,
                    credit_amount=Decimal('0'),
                    narration=f"Purchase of {asset.name}",
                    line_number=1
                )

                # Credit Cash Account
                JournalEntryLine.objects.create(
                    journal_entry=je,
                    account=cash_account,
                    debit_amount=Decimal('0'),
                    credit_amount=asset.purchase_price,
                    narration=f"Payment for {asset.name}",
                    line_number=2
                )

                # Create ledger entries
                _create_ledger_entries(je)

                self.stdout.write(self.style.SUCCESS(f"  [OK] Created journal entry for {asset.name}"))
                created_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  [ERROR] Error creating journal entry for {asset.name}: {e}"))
                error_count += 1

        self.stdout.write("\n" + "="*50)
        self.stdout.write(f"Summary:")
        self.stdout.write(f"  Created: {created_count}")
        self.stdout.write(f"  Skipped: {skipped_count}")
        self.stdout.write(f"  Errors:  {error_count}")
        self.stdout.write("="*50)
