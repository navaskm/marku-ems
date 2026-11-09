from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    CompanyViewSet,
    DepartmentViewSet,
    EmployeePasswordInviteView,
    EmployeeViewSet,
    HolidayViewSet,
    PasswordChangeView,
    ProfileView,
    login,
    set_password_from_invite,
)

router = DefaultRouter()
router.register("companies", CompanyViewSet, basename="company")
router.register("departments", DepartmentViewSet, basename="department")
router.register("employees", EmployeeViewSet, basename="employee")
router.register("holidays", HolidayViewSet, basename="holiday")
urlpatterns = [
    path("auth/login/", login),
    path("auth/password/setup/", set_password_from_invite),
    path("auth/password/change/", PasswordChangeView.as_view()),
    path("auth/profile/", ProfileView.as_view()),
    path("employees/<int:pk>/password-setup/", EmployeePasswordInviteView.as_view()),
    path("", include(router.urls)),
]
