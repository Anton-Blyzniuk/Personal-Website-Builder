from cloudinary.models import CloudinaryField
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import F, Q
from django.utils import timezone
from user.models import User


class PWBUnit(models.Model):
    TEMPLATE_CHOICES = [
        ('classic', 'Classic'),
        ('modern', 'Modern'),
        ('minimal', 'Minimal'),
    ]

    unit_name  = models.SlugField(unique=True)
    owner      = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pwbunits")
    first_name = models.CharField(max_length=63)
    last_name  = models.CharField(max_length=63)
    headline   = models.CharField(max_length=120)
    email      = models.EmailField()
    phone      = models.CharField(max_length=32, blank=True, null=True)
    location   = models.CharField(max_length=120, blank=True, null=True)
    about      = models.TextField(blank=True, null=True)
    template   = models.CharField(max_length=20, choices=TEMPLATE_CHOICES, default='classic')
    pdf_resume = CloudinaryField(
        "file",
        resource_type="raw",
        folder="PWBUnit_pdf_resumes",
        blank=True,
        type="upload",
        null=True,
    )

    def __str__(self):
        return self.unit_name


class Skill(models.Model):
    class Level(models.TextChoices):
        BEGINNER     = "Beginner",     "Beginner"
        INTERMEDIATE = "Intermediate", "Intermediate"
        ADVANCED     = "Advanced",     "Advanced"
        EXPERT       = "Expert",       "Expert"

    name     = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True, null=True)
    level    = models.CharField(max_length=20, choices=Level.choices, blank=True, null=True)
    order    = models.PositiveSmallIntegerField(default=0)
    pwb_unit = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="skills")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class Link(models.Model):
    name     = models.CharField(max_length=100)
    url      = models.URLField()
    pwb_unit = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="links")

    def __str__(self):
        return self.name


class Language(models.Model):
    class Level(models.TextChoices):
        A1_Beginner           = "A1 Beginner",           "A1 Beginner"
        A2_Elementary         = "A2 Elementary",         "A2 Elementary"
        B1_Intermediate       = "B1 Intermediate",       "B1 Intermediate"
        B2_Upper_Intermediate = "B2 Upper-Intermediate", "B2 Upper-Intermediate"
        C1_Advanced           = "C1 Advanced",           "C1 Advanced"
        C2_Advanced_Proficiency = "C2 Advanced Proficiency", "C2 Advanced Proficiency"
        Native                = "Native",                "Native"
        Bilingual             = "Bilingual",             "Bilingual"

    name     = models.CharField(max_length=100)
    level    = models.CharField(choices=Level.choices)
    pwb_unit = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="languages")

    def __str__(self):
        return self.name


class ExperienceUnit(models.Model):
    title        = models.CharField(max_length=120)
    organization = models.CharField(max_length=120, blank=True, null=True)
    location     = models.CharField(max_length=120, blank=True, null=True)
    description  = models.TextField(blank=True, null=True)
    from_date    = models.DateField()
    to_date      = models.DateField(blank=True, null=True)
    order        = models.PositiveSmallIntegerField(default=0)
    pwb_unit     = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="experience_units")

    def clean(self):
        if self.to_date and self.from_date and self.to_date <= self.from_date:
            raise ValidationError({"to_date": "to_date must be later than from_date"})

    class Meta:
        ordering = ["order"]
        constraints = [
            models.CheckConstraint(
                condition=Q(to_date__isnull=True) | Q(to_date__gt=F("from_date")),
                name="experience_to_date_after_from_date",
            )
        ]

    def __str__(self):
        return self.title


class EducationUnit(models.Model):
    institution    = models.CharField(max_length=150)
    degree         = models.CharField(max_length=120, blank=True, null=True)
    field_of_study = models.CharField(max_length=120, blank=True, null=True)
    location       = models.CharField(max_length=120, blank=True, null=True)
    from_date      = models.DateField()
    to_date        = models.DateField(blank=True, null=True)
    image          = CloudinaryField(
        "image",
        blank=True,
        null=True,
        folder="pwb_education_unit_images",
        transformation={
            "quality": "auto",
            "fetch_format": "auto",
            "width": 1200,
            "height": 1200,
            "crop": "limit",
        },
    )
    description = models.TextField(blank=True, null=True)
    order       = models.PositiveSmallIntegerField(default=0)
    pwb_unit    = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="education_units")

    def clean(self):
        if self.to_date and self.from_date and self.to_date <= self.from_date:
            raise ValidationError({"to_date": "to_date must be later than from_date"})

    class Meta:
        ordering = ["order"]
        constraints = [
            models.CheckConstraint(
                condition=Q(to_date__isnull=True) | Q(to_date__gt=F("from_date")),
                name="education_to_date_after_from_date",
            )
        ]

    def __str__(self):
        return self.institution


class PortfolioItem(models.Model):
    title       = models.CharField(max_length=150)
    category    = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    date        = models.DateField(blank=True, null=True)
    image       = CloudinaryField(
        "image",
        blank=True,
        null=True,
        folder="pwb_project_images",
        transformation={
            "quality": "auto:best",
            "fetch_format": "auto",
        },
    )
    order    = models.PositiveSmallIntegerField(default=0)
    pwb_unit = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="portfolio_items")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class PortfolioItemLink(models.Model):
    name           = models.CharField(max_length=100)
    url            = models.URLField()
    portfolio_item = models.ForeignKey(PortfolioItem, on_delete=models.CASCADE, related_name="links")

    def __str__(self):
        return self.name


class Certification(models.Model):
    name                 = models.CharField(max_length=150)
    issuing_organization = models.CharField(max_length=150)
    issue_date           = models.DateField(blank=True, null=True)
    expiry_date          = models.DateField(blank=True, null=True)
    credential_id        = models.CharField(max_length=100, blank=True, null=True)
    credential_url       = models.URLField(blank=True, null=True)
    image                = CloudinaryField(
        "image",
        blank=True,
        null=True,
        folder="pwb_certification_images",
        transformation={
            "quality": "auto:best",
            "fetch_format": "auto",
        },
    )
    order                = models.PositiveSmallIntegerField(default=0)
    pwb_unit             = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="certifications")

    def clean(self):
        if self.expiry_date and self.issue_date and self.expiry_date <= self.issue_date:
            raise ValidationError({"expiry_date": "expiry_date must be later than issue_date"})

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class Award(models.Model):
    title       = models.CharField(max_length=150)
    issuer      = models.CharField(max_length=150, blank=True, null=True)
    date        = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    order       = models.PositiveSmallIntegerField(default=0)
    pwb_unit    = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="awards")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class CustomSection(models.Model):
    title    = models.CharField(max_length=150)
    order    = models.PositiveSmallIntegerField(default=0)
    pwb_unit = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="custom_sections")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class CustomSectionItem(models.Model):
    title       = models.CharField(max_length=150)
    subtitle    = models.CharField(max_length=150, blank=True, null=True)
    from_date   = models.DateField(blank=True, null=True)
    to_date     = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    url         = models.URLField(blank=True, null=True)
    order       = models.PositiveSmallIntegerField(default=0)
    section     = models.ForeignKey(CustomSection, on_delete=models.CASCADE, related_name="items")

    def clean(self):
        if self.to_date and self.from_date and self.to_date <= self.from_date:
            raise ValidationError({"to_date": "to_date must be later than from_date"})

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class Photo(models.Model):
    image = CloudinaryField(
        "image",
        blank=True,
        null=True,
        folder="PWBUnit_photos_pwb",
        transformation={
            "quality": "auto",
            "fetch_format": "auto",
            "width": 1200,
            "height": 1200,
            "crop": "limit",
        },
    )
    is_main  = models.BooleanField(default=False)
    pwb_unit = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name="photos")

    def save(self, *args, **kwargs):
        if self.is_main:
            with transaction.atomic():
                Photo.objects.filter(pwb_unit=self.pwb_unit, is_main=True).exclude(
                    pk=self.pk
                ).update(is_main=False)
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)


class PWBUnitView(models.Model):
    SOURCE_WEB = 'web'
    SOURCE_API = 'api'
    SOURCE_CHOICES = [(SOURCE_WEB, 'Web'), (SOURCE_API, 'API')]

    pwb_unit    = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name='views')
    timestamp   = models.DateTimeField(default=timezone.now)
    source      = models.CharField(max_length=10, choices=SOURCE_CHOICES)
    ip_hash     = models.CharField(max_length=64, blank=True)
    device_type = models.CharField(max_length=10, blank=True)
    referrer    = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['pwb_unit', 'timestamp'], name='pwb_view_unit_time_idx'),
            models.Index(fields=['pwb_unit', 'source'],    name='pwb_view_unit_src_idx'),
        ]

    def __str__(self):
        return f"{self.pwb_unit.unit_name} [{self.source}]"
