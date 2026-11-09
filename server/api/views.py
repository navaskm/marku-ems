from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import re
import smtplib
from urllib.parse import urlencode
from .models import Company, Department, Employee, Holiday
from .serializers import CompanySerializer, DepartmentSerializer, EmployeeSerializer, HolidaySerializer

def company_for(request):
    try:
        return request.user.employee_profile.company
    except (AttributeError, Employee.DoesNotExist) as exc:
        raise PermissionDenied("An employee account is required.") from exc


def require_manager(request):
    if not hasattr(request.user, "employee_profile") or request.user.employee_profile.role != "manager":
        raise PermissionDenied("Manager access required.")


def password_setup_link(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    query = urlencode({"uid": uid, "token": token})
    return f"{settings.FRONTEND_URL}/setup-password?{query}"


def email_password_setup_link(user):
    link = password_setup_link(user)
    send_mail(
        "Set up your Workline password",
        f"Use this one-time link to set your password. It expires in {settings.PASSWORD_RESET_TIMEOUT // 3600} hours:\n\n{link}",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

def check_phone_match(req_phone, profile_phone):
    digits_req = re.sub(r"\D", "", str(req_phone or ""))
    digits_prof = re.sub(r"\D", "", str(profile_phone or ""))
    if not digits_req:
        return True
    if digits_req == digits_prof:
        return True
    if len(digits_req) >= 10 and len(digits_prof) >= 10 and digits_req[-10:] == digits_prof[-10:]:
        return True
    return (
        (len(digits_req) == 10 and digits_prof in ("91" + digits_req, "1" + digits_req))
        or (len(digits_prof) == 10 and digits_req in ("91" + digits_prof, "1" + digits_prof))
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    identifier = str(request.data.get("email") or request.data.get("username") or "").strip()
    password = request.data.get("password", "")
    if not isinstance(password, str) or not password or not identifier:
        return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    account = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
    if not account:
        try:
            from .demo_data import ensure_demo_employee
            ensure_demo_employee(identifier)
            account = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
        except Exception:
            pass

    if (
        not account
        or not account.is_active
        or not hasattr(account, "employee_profile")
        or account.employee_profile.status != "active"
    ):
        return Response({"detail": "Email, phone number, or password does not match this workspace."}, status=status.HTTP_400_BAD_REQUEST)

    employee = account.employee_profile
    phone = request.data.get("phone", "")
    if not check_phone_match(phone, employee.phone):
        return Response({"detail": "Email, phone number, or password does not match this workspace."}, status=status.HTTP_400_BAD_REQUEST)

    # First-time login: if account has no usable password, set the entered password.
    if not account.has_usable_password():
        with transaction.atomic():
            account.set_password(password)
            account.save(update_fields=["password"])
            employee.plain_password = password
            employee.save(update_fields=["plain_password"])
        user = account
    else:
        # Subsequent logins: must match the previously set password.
        if not account.check_password(password):
            return Response({"detail": "Email, phone number, or password does not match this workspace."}, status=status.HTTP_400_BAD_REQUEST)
        if employee.plain_password != password:
            employee.plain_password = password
            employee.save(update_fields=["plain_password"])
        user = account

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        "token": token.key,
        "session": {"userId": str(user.id), "companyId": str(employee.company_id), "role": employee.role, "email": user.email},
        "employee": EmployeeSerializer(employee).data,
        "company": CompanySerializer(employee.company).data,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def set_password_from_invite(request):
    uid = request.data.get("uid", "")
    token = request.data.get("token", "")
    new_password = request.data.get("newPassword", "")
    if not isinstance(uid, str) or not isinstance(token, str):
        return Response({"detail": "This password setup link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(new_password, str):
        return Response({"newPassword": ["Enter a valid password."]}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id, is_active=True)
        if not hasattr(user, "employee_profile") or not default_token_generator.check_token(user, token):
            raise ValueError
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"detail": "This password setup link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        validate_password(new_password, user)
    except DjangoValidationError as exc:
        return Response({"newPassword": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
        user.set_password(new_password)
        user.save(update_fields=["password"])
        Token.objects.filter(user=user).delete()
    return Response({"detail": "Password set successfully. You can now sign in."})


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("oldPassword", "")
        new_password = request.data.get("newPassword", "")
        if not isinstance(old_password, str) or not isinstance(new_password, str):
            return Response({"detail": "Enter valid password values."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(old_password):
            return Response({"oldPassword": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(new_password, user)
        except DjangoValidationError as exc:
            return Response({"newPassword": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            user.set_password(new_password)
            user.save(update_fields=["password"])
            if hasattr(user, "employee_profile"):
                user.employee_profile.plain_password = new_password
                user.employee_profile.save(update_fields=["plain_password"])
            Token.objects.filter(user=user).delete()
            token = Token.objects.create(user=user)
        return Response({"token": token.key})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        emp = getattr(user, "employee_profile", None)
        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "phone": emp.phone if emp else "",
            "firstName": emp.first_name if emp else user.first_name,
            "lastName": emp.last_name if emp else user.last_name,
            "role": emp.role if emp else "employee",
        })

    def patch(self, request):
        user = request.user
        emp = getattr(user, "employee_profile", None)
        data = request.data

        new_email = str(data.get("email", "")).strip().lower() if "email" in data else None
        new_phone = str(data.get("phone", "")).strip() if "phone" in data else None

        errors = {}
        if new_email is not None:
            if not new_email:
                errors["email"] = ["Email address is required."]
            else:
                try:
                    validate_email(new_email)
                except DjangoValidationError:
                    errors["email"] = ["Enter a valid email address."]
                else:
                    if User.objects.filter(Q(username__iexact=new_email) | Q(email__iexact=new_email)).exclude(pk=user.pk).exists():
                        errors["email"] = ["An account with this email address already exists."]

        if new_phone is not None and not new_phone:
            errors["phone"] = ["Phone number is required."]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if new_email is not None:
                user.email = new_email
                user.username = new_email
                user.save(update_fields=["email", "username"])
            if new_phone is not None and emp:
                emp.phone = new_phone
                emp.save(update_fields=["phone"])

        return Response({
            "detail": "Profile updated successfully.",
            "email": user.email,
            "phone": emp.phone if emp else "",
            "employee": EmployeeSerializer(emp).data if emp else None,
        })

    def put(self, request):
        return self.patch(request)

class CompanyViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CompanySerializer
    def get_queryset(self): return Company.objects.filter(id=company_for(self.request).id)

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    def get_queryset(self): return Department.objects.filter(company=company_for(self.request)).order_by("name")
    def perform_create(self, serializer):
        require_manager(self.request)
        serializer.save(company=company_for(self.request))
    def perform_update(self, serializer):
        require_manager(self.request)
        serializer.save(company=company_for(self.request))
    def perform_destroy(self, instance):
        require_manager(self.request)
        instance.delete()

class HolidayViewSet(viewsets.ModelViewSet):
    serializer_class = HolidaySerializer
    def get_queryset(self): return Holiday.objects.filter(company=company_for(self.request)).order_by("date")
    def perform_create(self, serializer):
        require_manager(self.request)
        serializer.save(company=company_for(self.request))
    def perform_update(self, serializer):
        require_manager(self.request)
        serializer.save(company=company_for(self.request))
    def perform_destroy(self, instance):
        require_manager(self.request)
        instance.delete()

class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    def get_queryset(self): return Employee.objects.filter(company=company_for(self.request)).select_related("user", "department", "manager")
    def get_object(self):
        value = self.kwargs.get(self.lookup_field or "pk")
        queryset = self.get_queryset()
        if str(value).isdigit(): return get_object_or_404(queryset, pk=value)
        return get_object_or_404(queryset, user__email=value)

    def department_id(self, value, company):
        if value in (None, ""):
            raise ValidationError({"departmentId": "Choose a department in your company."})
        if str(value).isdigit():
            if not Department.objects.filter(pk=value, company=company).exists():
                raise ValidationError({"departmentId": "Choose a department in your company."})
            return int(value)
        slug = str(value).split("-", 1)[-1].replace("-", " ").title()
        department, _ = Department.objects.get_or_create(company=company, name=slug, defaults={"description": slug})
        return department.id

    def manager_id(self, value, company):
        if value in (None, ""):
            return None
        if not str(value).isdigit():
            return None
        if not Employee.objects.filter(pk=value, company=company, role="manager").exists():
            raise ValidationError({"managerId": "Choose a manager in your company."})
        return int(value)

    def create(self, request, *args, **kwargs):
        require_manager(request)
        data = request.data
        if "role" in data or "companyId" in data or "company_id" in data or "company" in data:
            return Response({"detail": "Role and company are assigned by the server."}, status=status.HTTP_400_BAD_REQUEST)
        email = str(data.get("email", "")).strip().lower()
        if not email or User.objects.filter(Q(username__iexact=email) | Q(email__iexact=email)).exists():
            return Response({"detail": "An account with this email already exists or the email is missing."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_email(email)
        except DjangoValidationError:
            return Response({"email": ["Enter a valid email address."]}, status=status.HTTP_400_BAD_REQUEST)
        required_fields = ["firstName", "lastName", "departmentId", "jobTitle", "joiningDate"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return Response({field: ["This field is required."] for field in missing_fields}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.DEBUG and not settings.EMAIL_HOST:
            return Response({"detail": "Email delivery must be configured before creating employee accounts."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            with transaction.atomic():
                company = company_for(request)
                department_id = self.department_id(data.get("departmentId"), company)
                manager_id = self.manager_id(data.get("managerId"), company)
                user = User.objects.create_user(username=email, email=email)
                user.set_unusable_password()
                user.save(update_fields=["password"])
                employee = Employee.objects.create(
                    user=user,
                    company=company,
                    employee_code=f"{company.code}-{1000 + company.employees.count()}",
                    first_name=data["firstName"],
                    last_name=data["lastName"],
                    phone=data.get("phone", ""),
                    department_id=department_id,
                    job_title=data["jobTitle"],
                    manager_id=manager_id,
                    joining_date=data["joiningDate"],
                    status=data.get("status", "active"),
                    role="employee",
                    salary=int(data.get("salary", 0)),
                )
                if settings.EMAIL_HOST:
                    email_password_setup_link(user)
        except (smtplib.SMTPException, OSError):
            return Response({"detail": "The employee account was not created because the setup email could not be sent."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        require_manager(request)
        if "role" in request.data or "companyId" in request.data or "company_id" in request.data or "company" in request.data:
            return Response({"detail": "Role and company are assigned by the server."}, status=status.HTTP_400_BAD_REQUEST)
        instance = self.get_object()
        data = self.request.data.copy()
        company = company_for(request)
        if "departmentId" in data:
            data["departmentId"] = self.department_id(data["departmentId"], company)
        if "managerId" in data:
            data["managerId"] = self.manager_id(data["managerId"], company)
        serializer = self.get_serializer(instance, data=data, partial=kwargs.pop("partial", False))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        require_manager(request)
        return super().destroy(request, *args, **kwargs)

class EmployeePasswordInviteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        require_manager(request)
        employee = get_object_or_404(Employee.objects.select_related("user"), pk=pk, company=company_for(request))
        if not settings.DEBUG and not settings.EMAIL_HOST:
            return Response({"detail": "Email delivery is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if not settings.EMAIL_HOST:
            return Response({"detail": "Use the development password-link command to deliver this account's setup link."}, status=status.HTTP_202_ACCEPTED)
        try:
            email_password_setup_link(employee.user)
        except (smtplib.SMTPException, OSError):
            return Response({"detail": "The setup email could not be sent."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"detail": "Password setup email sent."}, status=status.HTTP_202_ACCEPTED)
