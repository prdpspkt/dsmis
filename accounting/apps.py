from django.apps import AppConfig


class AccountingConfig(AppConfig):
    name = 'accounting'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        # Import signals when the app is ready
        import accounting.signals
