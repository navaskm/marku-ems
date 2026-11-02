from datetime import date

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from api.models import Company, Department, Employee


class Command(BaseCommand):
    help = "Create development demo accounts with unusable passwords."

    def handle(self, *args, **options):
        if not settings.DEBUG or not settings.ALLOW_DEMO_SEED:
            raise CommandError(
                "Demo seeding requires DJANGO_DEBUG=true and ALLOW_DEMO_SEED=true."
            )

        from api.demo_data import ensure_demo_data
        ensure_demo_data()

        self.stdout.write(
            self.style.SUCCESS(
                "Development demo accounts are ready with no preset passwords. "
                "Issue setup links individually with create_password_setup_link."
            )
        )
