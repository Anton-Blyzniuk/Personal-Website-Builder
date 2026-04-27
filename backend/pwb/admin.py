import nested_admin
from django.db import transaction
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.forms.models import BaseInlineFormSet

from .models import (EducationUnit, ExperienceUnit, Language, Link, Photo,
                     Project, ProjectLink, PWBUnit, Skill)


class PWBUnitPhotoInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()

        main_count = 0

        for form in self.forms:
            if not form.cleaned_data or form.cleaned_data.get("DELETE"):
                continue

            if form.cleaned_data.get("is_main"):
                main_count += 1

        if main_count > 1:
            raise ValidationError("PWBUnit can have only one main photo.")


class PWBUnitPhotoInline(nested_admin.NestedTabularInline):
    model = Photo
    extra = 1
    formset = PWBUnitPhotoInlineFormSet


class SkillInline(nested_admin.NestedTabularInline):
    model = Skill
    extra = 1


class EducationUnitInline(nested_admin.NestedTabularInline):
    model = EducationUnit
    extra = 1


class ExperienceUnitInline(nested_admin.NestedTabularInline):
    model = ExperienceUnit
    extra = 1


class LinkInline(nested_admin.NestedTabularInline):
    model = Link
    extra = 1


class LanguageInline(nested_admin.NestedTabularInline):
    model = Language
    extra = 1


class ProjectLinkInline(nested_admin.NestedTabularInline):
    model = ProjectLink
    extra = 1


class ProjectInline(nested_admin.NestedTabularInline):
    model = Project
    extra = 1
    inlines = [ProjectLinkInline]


@admin.register(PWBUnit)
class PWBUnitAdmin(nested_admin.NestedModelAdmin):
    inlines = [
        SkillInline,
        LinkInline,
        LanguageInline,
        ExperienceUnitInline,
        ProjectInline,
        EducationUnitInline,
        PWBUnitPhotoInline,
    ]

    def save_formset(self, request, form, formset, change):
        if formset.model == Photo:
            instances = formset.save(commit=False)
    
            main_instance = next(
                (obj for obj in instances if obj.is_main),
                None
            )
    
            with transaction.atomic():
                if main_instance:
                    Photo.objects.filter(
                        pwb_unit=form.instance,
                        is_main=True
                    ).exclude(pk=main_instance.pk).update(is_main=False)
    
                for obj in instances:
                    obj.pwb_unit = form.instance
                    obj.save()
    
                formset.save_m2m()
        else:
            super().save_formset(request, form, formset, change)
