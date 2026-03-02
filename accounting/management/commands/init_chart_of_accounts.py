from django.core.management.base import BaseCommand
from accounting.utils import initialize_chart_of_accounts


class Command(BaseCommand):
    help = 'Initialize the chart of accounts for the driving school'

    def handle(self, *args, **options):
        self.stdout.write('Initializing chart of accounts...')

        try:
            accounts = initialize_chart_of_accounts()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created {len(accounts)} accounts')
            )

            for account in accounts:
                self.stdout.write(f'  - {account.code}: {account.name}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error initializing chart of accounts: {str(e)}')
            )
