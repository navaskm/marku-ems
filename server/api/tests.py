from urllib.parse import parse_qs, urlsplit

from django.contrib.auth.models import User
from django.core import mail
from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from api.models import Company, Department, Employee


@override_settings(
    DEBUG=True,
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    EMAIL_HOST="smtp.test",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="test@example.test",
    FRONTEND_URL="http://localhost:3000",
)
class AuthenticationAPITests(TestCase):
    password_one = "Kite!Ridge2026-Alpha"
    password_two = "River!Stone2026-Bravo"

    def setUp(self):
        self.company_a = Company.objects.create(name="Company A", code="CMPA")
        self.company_b = Company.objects.create(name="Company B", code="CMPB")
        self.department_a = Department.objects.create(company=self.company_a, name="Engineering")
        self.department_b = Department.objects.create(company=self.company_b, name="Operations")
        self.manager_a = self.make_employee_user(
            self.company_a, self.department_a, "manager-a@example.test", "Manager", "A", "manager", "5551001"
        )
        self.employee_a = self.make_employee_user(
            self.company_a, self.department_a, "employee-a@example.test", "Employee", "A", "employee", "5551002"
        )
        self.manager_b = self.make_employee_user(
            self.company_b, self.department_b, "manager-b@example.test", "Manager", "B", "manager", "5552001"
        )
        self.employee_b = self.make_employee_user(
            self.company_b, self.department_b, "employee-b@example.test", "Employee", "B", "employee", "5552002"
        )

    def make_employee_user(self, company, department, email, first, last, role, phone):
        user = User.objects.create_user(username=email, email=email, password="Fixture!Pass2026")
        Employee.objects.create(
            user=user,
            company=company,
            department=department,
            employee_code=email.split("@")[0],
            first_name=first,
            last_name=last,
            phone=phone,
            job_title="Test role",
            joining_date="2024-01-01",
            role=role,
        )
        return user

    def authenticated_client(self, user):
        client = APIClient()
        token, _ = Token.objects.get_or_create(user=user)
        client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        return client

    def invitation_credentials(self, user):
        message = mail.outbox[-1]
        setup_url = next(line for line in message.body.splitlines() if "/setup-password?" in line)
        query = parse_qs(urlsplit(setup_url).query)
        return query["uid"][0], query["token"][0]

    def create_employee(self, client, email, phone):
        return client.post(
            "/api/employees/",
            {
                "email": email,
                "firstName": "New",
                "lastName": "Colleague",
                "phone": phone,
                "departmentId": self.department_a.pk,
                "jobTitle": "Analyst",
                "joiningDate": "2024-02-01",
                "status": "active",
            },
            format="json",
        )

    def test_employee_accounts_have_separate_passwords_and_invites_are_single_use(self):
        manager = self.authenticated_client(self.manager_a)
        first = self.create_employee(manager, "new-a@example.test", "5553001")
        self.assertEqual(first.status_code, 201)
        user_one = User.objects.get(email="new-a@example.test")
        self.assertFalse(user_one.has_usable_password())
        self.assertNotIn("password", first.data)
        self.assertNotIn("password_hash", first.data)
        uid_one, token_one = self.invitation_credentials(user_one)

        second = self.create_employee(manager, "new-b@example.test", "5553002")
        self.assertEqual(second.status_code, 201)
        user_two = User.objects.get(email="new-b@example.test")
        self.assertFalse(user_two.has_usable_password())
        uid_two, token_two = self.invitation_credentials(user_two)

        setup = APIClient()
        weak_password = setup.post(
            "/api/auth/password/setup/",
            {"uid": uid_one, "token": token_one, "newPassword": "123"},
            format="json",
        )
        self.assertEqual(weak_password.status_code, 400)
        self.assertEqual(
            setup.post("/api/auth/password/setup/", {"uid": uid_one, "token": token_one, "newPassword": self.password_one}, format="json").status_code,
            200,
        )
        self.assertEqual(
            setup.post("/api/auth/password/setup/", {"uid": uid_two, "token": token_two, "newPassword": self.password_two}, format="json").status_code,
            200,
        )
        replay = setup.post("/api/auth/password/setup/", {"uid": uid_one, "token": token_one, "newPassword": self.password_two}, format="json")
        self.assertEqual(replay.status_code, 400)

        login_one = setup.post("/api/auth/login/", {"email": user_one.email, "password": self.password_one, "phone": "5553001"}, format="json")
        login_two = setup.post("/api/auth/login/", {"email": user_two.email, "password": self.password_two, "phone": "5553002"}, format="json")
        self.assertEqual(login_one.status_code, 200)
        self.assertEqual(login_two.status_code, 200)
        self.assertNotEqual(login_one.data["token"], login_two.data["token"])
        self.assertEqual(
            setup.post("/api/auth/login/", {"email": user_two.email, "password": self.password_one, "phone": "5553002"}, format="json").status_code,
            400,
        )
        self.assertEqual(
            setup.post("/api/auth/login/", {"email": user_one.email, "password": "incorrect", "phone": "5553001"}, format="json").status_code,
            400,
        )

    def test_password_change_rotates_tokens_and_rejects_old_password(self):
        client = self.authenticated_client(self.employee_a)
        old_token = Token.objects.get(user=self.employee_a).key
        response = client.post(
            "/api/auth/password/change/",
            {"oldPassword": "Fixture!Pass2026", "newPassword": self.password_one},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.data["token"], old_token)
        old_client = APIClient()
        old_client.credentials(HTTP_AUTHORIZATION=f"Token {old_token}")
        self.assertEqual(old_client.get("/api/employees/").status_code, 401)
        new_client = APIClient()
        new_client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        self.assertEqual(new_client.get("/api/employees/").status_code, 200)
        self.assertEqual(
            APIClient().post("/api/auth/login/", {"email": self.employee_a.email, "password": "Fixture!Pass2026"}, format="json").status_code,
            400,
        )
        self.assertEqual(
            APIClient().post("/api/auth/login/", {"email": self.employee_a.email, "password": self.password_one}, format="json").status_code,
            200,
        )

    def test_inactive_user_and_employee_cannot_log_in(self):
        client = APIClient()
        self.employee_a.is_active = False
        self.employee_a.save(update_fields=["is_active"])
        inactive_user = client.post(
            "/api/auth/login/",
            {"email": self.employee_a.email, "password": "Fixture!Pass2026", "phone": "5551002"},
            format="json",
        )
        self.assertEqual(inactive_user.status_code, 400)

        self.employee_a.is_active = True
        self.employee_a.save(update_fields=["is_active"])
        self.employee_a.employee_profile.status = "inactive"
        self.employee_a.employee_profile.save(update_fields=["status"])
        inactive_employee = client.post(
            "/api/auth/login/",
            {"email": self.employee_a.email, "password": "Fixture!Pass2026", "phone": "5551002"},
            format="json",
        )
        self.assertEqual(inactive_employee.status_code, 400)

    def test_manager_role_and_company_authorization_and_employee_crud(self):
        manager = self.authenticated_client(self.manager_a)
        self.assertEqual(
            manager.post(
                "/api/employees/",
                {
                    "email": "manager-injection@example.test",
                    "firstName": "Injected",
                    "lastName": "Manager",
                    "departmentId": self.department_a.pk,
                    "jobTitle": "Manager",
                    "joiningDate": "2024-02-01",
                    "role": "manager",
                },
                format="json",
            ).status_code,
            400,
        )
        self.assertFalse(User.objects.filter(email="manager-injection@example.test").exists())

        employee_client = self.authenticated_client(self.employee_a)
        self.assertEqual(self.create_employee(employee_client, "blocked@example.test", "5553112").status_code, 403)
        self.assertEqual(employee_client.patch(f"/api/employees/{self.employee_a.employee_profile.pk}/", {"role": "manager"}, format="json").status_code, 403)
        self.assertEqual(
            manager.patch(f"/api/employees/{self.employee_b.employee_profile.pk}/", {"status": "inactive"}, format="json").status_code,
            404,
        )
        self.assertEqual(manager.delete(f"/api/employees/{self.employee_b.employee_profile.pk}/").status_code, 404)
        self.assertEqual(self.employee_b.employee_profile.status, "active")

        created = self.create_employee(manager, "crud@example.test", "5553113")
        self.assertEqual(created.status_code, 201)
        employee_id = created.data["id"]
        self.assertEqual(manager.get(f"/api/employees/{employee_id}/").status_code, 200)
        self.assertEqual(manager.patch(f"/api/employees/{employee_id}/", {"status": "inactive"}, format="json").status_code, 200)
        self.assertEqual(manager.patch(f"/api/employees/{employee_id}/", {"role": "manager"}, format="json").status_code, 400)
        self.assertEqual(Employee.objects.get(pk=employee_id).role, "employee")
        self.assertEqual(manager.delete(f"/api/employees/{employee_id}/").status_code, 204)

    def test_foreign_company_department_cannot_be_assigned(self):
        manager = self.authenticated_client(self.manager_a)
        response = self.create_employee(manager, "foreign-dept@example.test", "5553222")
        self.assertEqual(response.status_code, 201)
        employee = Employee.objects.get(user__email="foreign-dept@example.test")
        update = manager.patch(
            f"/api/employees/{employee.pk}/",
            {"departmentId": self.department_b.pk},
            format="json",
        )
        self.assertEqual(update.status_code, 400)
        employee.refresh_from_db()
        self.assertEqual(employee.department.company_id, self.company_a.pk)

    def test_demo_seed_requires_opt_in_and_preserves_existing_passwords(self):
        existing = User.objects.create_user(
            username="manager@acme.demo",
            email="manager@acme.demo",
            password="Legacy!Password2026",
        )
        with self.assertRaises(CommandError):
            call_command("seed_demo")
        with override_settings(DEBUG=True, ALLOW_DEMO_SEED=True):
            call_command("seed_demo")
        existing.refresh_from_db()
        self.assertTrue(existing.check_password("Legacy!Password2026"))

    def test_employee_first_time_login_sets_password_and_second_time_requires_it(self):
        # Create an employee without a usable password
        user = User.objects.create_user(username="test-first-login@example.test", email="test-first-login@example.test")
        user.set_unusable_password()
        user.save(update_fields=["password"])
        Employee.objects.create(
            user=user,
            company=self.company_a,
            department=self.department_a,
            employee_code="TEST-001",
            first_name="Test",
            last_name="Employee",
            phone="+1 (512) 555-0161",
            job_title="Engineer",
            joining_date="2024-01-01",
            role="employee",
            status="active",
        )
        self.assertFalse(user.has_usable_password())

        client = APIClient()

        # Login with wrong phone number fails
        wrong_phone = client.post(
            "/api/auth/login/",
            {"email": "test-first-login@example.test", "phone": "+1 (512) 555-9999", "password": "fatimaalsayed"},
            format="json",
        )
        self.assertEqual(wrong_phone.status_code, 400)
        user.refresh_from_db()
        self.assertFalse(user.has_usable_password())

        # First-time login with own password sets password and succeeds
        first_login = client.post(
            "/api/auth/login/",
            {"email": "test-first-login@example.test", "phone": "+1 (512) 555-0161", "password": "fatimaalsayed"},
            format="json",
        )
        self.assertEqual(first_login.status_code, 200)
        self.assertIn("token", first_login.data)
        user.refresh_from_db()
        self.assertTrue(user.has_usable_password())
        self.assertTrue(user.check_password("fatimaalsayed"))

        # Second-time login with correct password succeeds
        second_login_ok = client.post(
            "/api/auth/login/",
            {"email": "test-first-login@example.test", "phone": "+1 (512) 555-0161", "password": "fatimaalsayed"},
            format="json",
        )
        self.assertEqual(second_login_ok.status_code, 200)

        # Second-time login with wrong password fails
        second_login_wrong = client.post(
            "/api/auth/login/",
            {"email": "test-first-login@example.test", "phone": "+1 (512) 555-0161", "password": "differentpassword"},
            format="json",
        )
        self.assertEqual(second_login_wrong.status_code, 400)

    def test_fatima_demo_login_sets_password_and_enforces_it(self):
        client = APIClient()
        # Fatima exists in demo seed data and can log in on first attempt
        first_login = client.post(
            "/api/auth/login/",
            {"email": "fatima.alsayed@acme.demo", "phone": "+1 (512) 555-0161", "password": "fatimaalsayed"},
            format="json",
        )
        self.assertEqual(first_login.status_code, 200)
        self.assertIn("token", first_login.data)
        self.assertEqual(first_login.data["session"]["role"], "employee")

        # Second login with same password succeeds
        second_login = client.post(
            "/api/auth/login/",
            {"email": "fatima.alsayed@acme.demo", "phone": "+1 (512) 555-0161", "password": "fatimaalsayed"},
            format="json",
        )
        self.assertEqual(second_login.status_code, 200)

        # Second login with incorrect password fails
        failed_login = client.post(
            "/api/auth/login/",
            {"email": "fatima.alsayed@acme.demo", "phone": "+1 (512) 555-0161", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(failed_login.status_code, 400)
