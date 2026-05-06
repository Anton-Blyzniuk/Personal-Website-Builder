from cloudinary.models import CloudinaryField
from django.contrib.auth.models import (AbstractBaseUser, BaseUserManager,
                                        PermissionsMixin)
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if not extra_fields.get("is_staff"):
            raise ValueError("Superuser must have is_staff=True.")
        if not extra_fields.get("is_superuser"):
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    PLAN_FREE = "free"
    PLAN_PRO = "pro"
    PLAN_PRO_PLUS = "pro_plus"
    PLAN_OWNER = "owner"

    PLAN_CHOICES = [
        (PLAN_FREE, "Free"),
        (PLAN_PRO, "Pro"),
        (PLAN_PRO_PLUS, "Pro+"),
        (PLAN_OWNER, "Owner"),
    ]

    # None means unlimited
    PLAN_LIMITS = {
        PLAN_FREE: 1,
        PLAN_PRO: 3,
        PLAN_PRO_PLUS: 10,
        PLAN_OWNER: None,
    }

    email = models.EmailField(unique=True)
    profile_picture = CloudinaryField(
        "photo", blank=True, null=True, folder="profile_pictures"
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default=PLAN_FREE)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return self.email


class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.expires_at


class APICredential(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name="api_credential")
    key         = models.CharField(max_length=40, unique=True, db_index=True)
    secret_hash = models.CharField(max_length=128)
    created_at  = models.DateTimeField(auto_now_add=True)
    is_active   = models.BooleanField(default=True)

    def __str__(self):
        return f"APICredential({self.user.email})"
