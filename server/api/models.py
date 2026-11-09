from django.contrib.auth.models import User
from django.db import models

class Company(models.Model):
    name = models.CharField(max_length=160)
    code = models.CharField(max_length=20, unique=True)
    industry = models.CharField(max_length=160, blank=True)
    headquarters = models.CharField(max_length=160, blank=True)
    timezone = models.CharField(max_length=80, default="UTC")
    work_start = models.TimeField(default="09:00")
    late_after = models.TimeField(default="09:15")
    work_end = models.TimeField(default="18:00")

class Department(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="departments")
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)

class Employee(models.Model):
    ROLE_CHOICES = (("manager", "Manager"), ("employee", "Employee"))
    STATUS_CHOICES = (("active", "Active"), ("inactive", "Inactive"))
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="employee_profile")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="employees")
    employee_code = models.CharField(max_length=40)
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    phone = models.CharField(max_length=40)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="employees")
    job_title = models.CharField(max_length=120)
    manager = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="direct_reports")
    joining_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")
    avatar_hue = models.PositiveSmallIntegerField(default=220)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="employee")
    plain_password = models.CharField(max_length=128, blank=True, default="")
    salary = models.PositiveIntegerField(default=0)

class Holiday(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="holidays")
    name = models.CharField(max_length=120)
    date = models.DateField()

    class Meta:
        ordering = ["date"]

class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="attendance")
    date = models.DateField()
    status = models.CharField(max_length=12, default="present")
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    working_minutes = models.PositiveIntegerField(default=0)

class LeaveRequest(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="leave_requests")
    leave_type = models.CharField(max_length=10)
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.PositiveIntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=12, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

class Announcement(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="announcements")
    author = models.ForeignKey(Employee, on_delete=models.CASCADE)
    title = models.CharField(max_length=180)
    body = models.TextField()
    published_at = models.DateTimeField(auto_now_add=True)
