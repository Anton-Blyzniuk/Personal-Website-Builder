from rest_framework import serializers

from .models import (EducationUnit, ExperienceUnit, Language, Link, Photo,
                     Project, ProjectLink, PWBUnit, Skill)


class ProjectLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectLink
        fields = ["name", "url"]


class ProjectSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    links = ProjectLinkSerializer(many=True)

    class Meta:
        model = Project
        fields = ["name", "description", "links", "image"]

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None


class PhotoSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ["image", "is_main"]

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None


class EducationUnitSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = EducationUnit
        fields = ["name", "description", "from_date", "to_date", "image"]

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None


class ExperienceUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceUnit
        fields = ["name", "description", "from_date", "to_date"]


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["name"]


class LinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Link
        fields = ["name", "url"]


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["name", "level"]


class PWBUnitSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True)
    links = LinkSerializer(many=True)
    languages = LanguageSerializer(many=True)
    experience_units = ExperienceUnitSerializer(many=True)
    education_units = EducationUnitSerializer(many=True)
    photos = PhotoSerializer(many=True)
    projects = ProjectSerializer(many=True)
    pdf_resume = serializers.SerializerMethodField()

    class Meta:
        model = PWBUnit
        fields = [
            "frist_name",
            "last_name",
            "profession",
            "email",
            "about",
            "pdf_resume",
            "skills",
            "links",
            "languages",
            "experience_units",
            "education_units",
            "projects",
            "photos",
        ]

    def get_pdf_resume(self, obj):
        if obj.pdf_resume:
            url = obj.pdf_resume.url.replace(
                "/upload/",
                "/upload/fl_attachment/"
            )
            return url.replace("http://", "https://")
        return None
