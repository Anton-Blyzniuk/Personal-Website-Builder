from django.urls import path

from .views import (AdminRegistrationView, APICredentialRotateView,
                    APICredentialView, ChangePasswordView, MyInfoView,
                    UserRegistrationView)

urlpatterns = [
    path("user/register/",         UserRegistrationView.as_view(),   name="register"),
    path("admin/register/",        AdminRegistrationView.as_view(),  name="admin-register"),
    path("user/my-info/",          MyInfoView.as_view(),             name="my-info"),
    path("user/change-password/",  ChangePasswordView.as_view(),     name="change-password"),
    path("user/api-key/",          APICredentialView.as_view(),      name="api-key"),
    path("user/api-key/rotate/",   APICredentialRotateView.as_view(), name="api-key-rotate"),
]
