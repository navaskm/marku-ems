from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from api.views import password_setup_link


class Command(BaseCommand):
    help = "Print a one-time password setup link for a development employee account."

    def add_arguments(self, parser):
        parser.add_argument("email")

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Password setup links can only be printed while DJANGO_DEBUG=true.")
        user = User.objects.filter(email__iexact=options["email"]).first()
        if user is None or not hasattr(user, "employee_profile"):
            raise CommandError("No employee account matches that email.")
        self.stdout.write(password_setup_link(user))
