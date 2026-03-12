from django.contrib import admin

from .models import Link, ProjectRole, Teammate


class LinkInline(admin.TabularInline):
    model = Link
    extra = 1


@admin.register(ProjectRole)
class ProjectRoleAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Teammate)
class TeammateAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name")
    search_fields = ("first_name", "last_name")
    inlines = [LinkInline]


@admin.register(Link)
class LinkAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)
