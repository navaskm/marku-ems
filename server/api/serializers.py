from rest_framework import serializers
from .models import Announcement, Company, Department, Employee, Holiday

class CompanySerializer(serializers.ModelSerializer):
    logoInitials = serializers.SerializerMethodField()
    workStart = serializers.TimeField(source="work_start", format="%H:%M")
    lateAfter = serializers.TimeField(source="late_after", format="%H:%M")
    workEnd = serializers.TimeField(source="work_end", format="%H:%M")
    class Meta:
        model = Company
        fields = ["id", "name", "code", "industry", "headquarters", "timezone", "workStart", "lateAfter", "workEnd", "logoInitials"]
    def get_logoInitials(self, obj): return "".join(word[0] for word in obj.name.split()[:2]).upper()

class DepartmentSerializer(serializers.ModelSerializer):
    companyId = serializers.IntegerField(source="company_id", read_only=True)
    class Meta:
        model = Department
        fields = ["id", "companyId", "name", "description"]

class EmployeeSerializer(serializers.ModelSerializer):
    companyId = serializers.IntegerField(source="company_id", read_only=True)
    userId = serializers.IntegerField(source="user_id", read_only=True)
    employeeCode = serializers.CharField(source="employee_code", read_only=True)
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    departmentId = serializers.IntegerField(source="department_id")
    jobTitle = serializers.CharField(source="job_title")
    managerId = serializers.IntegerField(source="manager_id", allow_null=True, required=False)
    joiningDate = serializers.DateField(source="joining_date")
    avatarHue = serializers.IntegerField(source="avatar_hue", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    password = serializers.CharField(source="plain_password", read_only=True)
    salary = serializers.IntegerField(default=0)
    class Meta:
        model = Employee
        fields = ["id", "companyId", "userId", "employeeCode", "firstName", "lastName", "email", "phone", "departmentId", "jobTitle", "managerId", "joiningDate", "status", "avatarHue", "password", "salary"]

class HolidaySerializer(serializers.ModelSerializer):
    companyId = serializers.IntegerField(source="company_id", read_only=True)
    class Meta:
        model = Holiday
        fields = ["id", "companyId", "name", "date"]

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = "__all__"
