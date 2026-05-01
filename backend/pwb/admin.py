import nested_admin
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.db import transaction
from django.forms.models import BaseInlineFormSet

from .models import (
    Award, Certification, CustomSection, CustomSectionItem,
    EducationUnit, ExperienceUnit, Language, Link, Photo,
    PortfolioItem, PortfolioItemLink, PWBUnit, Skill,
)


class PWBUnitPhotoInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()
        main_count = sum(
            1 for form in self.forms
            if form.cleaned_data and not form.cleaned_data.get("DELETE") and form.cleaned_data.get("is_main")
        )
        if main_count > 1:
            raise ValidationError("PWBUnit can have only one main photo.")


class PWBUnitPhotoInline(nested_admin.NestedTabularInline):
    model = Photo
    extra = 1
    formset = PWBUnitPhotoInlineFormSet


class SkillInline(nested_admin.NestedTabularInline):
    model = Skill
    extra = 1


class LanguageInline(nested_admin.NestedTabularInline):
    model = Language
    extra = 1


class LinkInline(nested_admin.NestedTabularInline):
    model = Link
    extra = 1


class ExperienceUnitInline(nested_admin.NestedTabularInline):
    model = ExperienceUnit
    extra = 1


class EducationUnitInline(nested_admin.NestedTabularInline):
    model = EducationUnit
    extra = 1


class PortfolioItemLinkInline(nested_admin.NestedTabularInline):
    model = PortfolioItemLink
    extra = 1


class PortfolioItemInline(nested_admin.NestedTabularInline):
    model = PortfolioItem
    extra = 1
    inlines = [PortfolioItemLinkInline]


class CertificationInline(nested_admin.NestedTabularInline):
    model = Certification
    extra = 1


class AwardInline(nested_admin.NestedTabularInline):
    model = Award
    extra = 1


class CustomSectionItemInline(nested_admin.NestedTabularInline):
    model = CustomSectionItem
    extra = 1


class CustomSectionInline(nested_admin.NestedTabularInline):
    model = CustomSection
    extra = 1
    inlines = [CustomSectionItemInline]


@admin.register(PWBUnit)
class PWBUnitAdmin(nested_admin.NestedModelAdmin):
    inlines = [
        SkillInline,
        LinkInline,
        LanguageInline,
        ExperienceUnitInline,
        PortfolioItemInline,
        EducationUnitInline,
        CertificationInline,
        AwardInline,
        CustomSectionInline,
        PWBUnitPhotoInline,
    ]

    def save_formset(self, request, form, formset, change):
        if formset.model == Photo:
            instances = formset.save(commit=False)
            main_instance = next((obj for obj in instances if obj.is_main), None)
            with transaction.atomic():
                for obj in formset.deleted_objects:
                    obj.delete()
                if main_instance:
                    Photo.objects.filter(
                        pwb_unit=form.instance, is_main=True
                    ).exclude(pk=main_instance.pk).update(is_main=False)
                for obj in instances:
                    obj.pwb_unit = form.instance
                    obj.save()
                formset.save_m2m()
        else:
            super().save_formset(request, form, formset, change)
