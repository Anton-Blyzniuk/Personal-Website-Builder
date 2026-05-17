from django.db import transaction
from rest_framework import serializers

from .models import (
    Award, Certification, CustomSection, CustomSectionItem,
    EducationUnit, ExperienceUnit, Language, Link, Photo,
    PortfolioItem, PortfolioItemLink, PWBUnit, Skill,
)


# ---------------------------------------------------------------------------
# Read-only serializers (retrieve)
# ---------------------------------------------------------------------------

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["name", "category", "level", "order"]


class LinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Link
        fields = ["name", "url"]


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["name", "level"]


class ExperienceUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceUnit
        fields = ["id", "title", "organization", "location", "description", "from_date", "to_date", "order"]


class EducationUnitSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = EducationUnit
        fields = [
            "id", "institution", "degree", "field_of_study", "location",
            "from_date", "to_date", "description", "image", "order",
        ]

    def get_image(self, obj):
        return obj.image.url if obj.image else None


class PortfolioItemLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioItemLink
        fields = ["name", "url"]


class PortfolioItemSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    links = PortfolioItemLinkSerializer(many=True)

    class Meta:
        model = PortfolioItem
        fields = ["id", "title", "category", "description", "date", "image", "links", "order"]

    def get_image(self, obj):
        return obj.image.url if obj.image else None


class CertificationSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Certification
        fields = ["id", "name", "issuing_organization", "issue_date", "expiry_date",
                  "credential_id", "credential_url", "image", "order"]

    def get_image(self, obj):
        return obj.image.url if obj.image else None


class AwardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Award
        fields = ["title", "issuer", "date", "description", "order"]


class CustomSectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomSectionItem
        fields = ["title", "subtitle", "from_date", "to_date", "description", "url", "order"]


class CustomSectionSerializer(serializers.ModelSerializer):
    items = CustomSectionItemSerializer(many=True)

    class Meta:
        model = CustomSection
        fields = ["title", "order", "items"]


class PhotoSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ["id", "image", "is_main"]

    def get_image(self, obj):
        return obj.image.url if obj.image else None


class PWBUnitSerializer(serializers.ModelSerializer):
    skills           = SkillSerializer(many=True)
    links            = LinkSerializer(many=True)
    languages        = LanguageSerializer(many=True)
    experience_units = ExperienceUnitSerializer(many=True)
    education_units  = EducationUnitSerializer(many=True)
    portfolio_items  = PortfolioItemSerializer(many=True)
    certifications   = CertificationSerializer(many=True)
    awards           = AwardSerializer(many=True)
    custom_sections  = CustomSectionSerializer(many=True)
    photos           = PhotoSerializer(many=True)
    pdf_resume       = serializers.SerializerMethodField()

    class Meta:
        model = PWBUnit
        fields = [
            "unit_name",
            "first_name",
            "last_name",
            "headline",
            "email",
            "phone",
            "location",
            "about",
            "template",
            "pdf_resume",
            "skills",
            "links",
            "languages",
            "experience_units",
            "education_units",
            "portfolio_items",
            "certifications",
            "awards",
            "custom_sections",
            "photos",
        ]

    def get_pdf_resume(self, obj):
        if obj.pdf_resume:
            url = obj.pdf_resume.url.replace("/upload/", "/upload/fl_attachment/")
            return url.replace("http://", "https://")
        return None


class PWBUnitListSerializer(serializers.ModelSerializer):
    """Lightweight summary for the list endpoint."""

    class Meta:
        model = PWBUnit
        fields = ["unit_name", "first_name", "last_name", "headline", "email", "phone", "location", "template"]


# ---------------------------------------------------------------------------
# Writable child serializers (shared by create & update)
# ---------------------------------------------------------------------------

class _DateRangeValidatorMixin:
    def validate(self, data):
        if data.get("to_date") and data.get("from_date") and data["to_date"] <= data["from_date"]:
            raise serializers.ValidationError({"to_date": "to_date must be later than from_date"})
        return data


class SkillWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["name", "category", "level", "order"]


class LinkWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Link
        fields = ["name", "url"]


class LanguageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["name", "level"]


class ExperienceUnitWriteSerializer(_DateRangeValidatorMixin, serializers.ModelSerializer):
    class Meta:
        model = ExperienceUnit
        fields = ["title", "organization", "location", "description", "from_date", "to_date", "order"]


class EducationUnitWriteSerializer(_DateRangeValidatorMixin, serializers.ModelSerializer):
    class Meta:
        model = EducationUnit
        fields = ["institution", "degree", "field_of_study", "location",
                  "from_date", "to_date", "description", "order"]


class PortfolioItemLinkWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioItemLink
        fields = ["name", "url"]


class PortfolioItemWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    links = PortfolioItemLinkWriteSerializer(many=True, required=False)

    class Meta:
        model = PortfolioItem
        fields = ["id", "title", "category", "description", "date", "order", "links"]


class CertificationWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Certification
        fields = ["id", "name", "issuing_organization", "issue_date", "expiry_date",
                  "credential_id", "credential_url", "order"]

    def validate(self, data):
        if data.get("expiry_date") and data.get("issue_date") and data["expiry_date"] <= data["issue_date"]:
            raise serializers.ValidationError({"expiry_date": "expiry_date must be later than issue_date"})
        return data


class AwardWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Award
        fields = ["title", "issuer", "date", "description", "order"]


class CustomSectionItemWriteSerializer(_DateRangeValidatorMixin, serializers.ModelSerializer):
    class Meta:
        model = CustomSectionItem
        fields = ["title", "subtitle", "from_date", "to_date", "description", "url", "order"]


class CustomSectionWriteSerializer(serializers.ModelSerializer):
    items = CustomSectionItemWriteSerializer(many=True, required=False)

    class Meta:
        model = CustomSection
        fields = ["title", "order", "items"]


# ---------------------------------------------------------------------------
# Helpers shared between create and update
# ---------------------------------------------------------------------------

def _build_nested_kwargs(pwb_unit, validated_data):
    """Pop nested list data from validated_data, return it keyed by relation name."""
    keys = [
        "skills", "links", "languages", "experience_units", "education_units",
        "portfolio_items", "certifications", "awards", "custom_sections",
    ]
    return {k: validated_data.pop(k, None) for k in keys}


def _save_nested(pwb_unit, nested, replace=True):
    """
    Persist nested relations onto pwb_unit.
    When replace=True (create), treat absent keys same as empty list.
    When replace=False (update), skip absent keys entirely.
    """
    def _handle(key, fn):
        value = nested[key]
        if value is None:
            if replace:
                value = []
            else:
                return
        fn(value)

    _handle("skills", lambda data: (
        pwb_unit.skills.all().delete(),
        Skill.objects.bulk_create([Skill(pwb_unit=pwb_unit, **d) for d in data]),
    ))
    _handle("links", lambda data: (
        pwb_unit.links.all().delete(),
        Link.objects.bulk_create([Link(pwb_unit=pwb_unit, **d) for d in data]),
    ))
    _handle("languages", lambda data: (
        pwb_unit.languages.all().delete(),
        Language.objects.bulk_create([Language(pwb_unit=pwb_unit, **d) for d in data]),
    ))
    _handle("experience_units", lambda data: (
        pwb_unit.experience_units.all().delete(),
        ExperienceUnit.objects.bulk_create([ExperienceUnit(pwb_unit=pwb_unit, **d) for d in data]),
    ))
    _handle("education_units", lambda data: (
        pwb_unit.education_units.all().delete(),
        EducationUnit.objects.bulk_create([EducationUnit(pwb_unit=pwb_unit, **d) for d in data]),
    ))
    _handle("certifications", lambda data: _save_certifications(pwb_unit, data))
    _handle("awards", lambda data: (
        pwb_unit.awards.all().delete(),
        Award.objects.bulk_create([Award(pwb_unit=pwb_unit, **d) for d in data]),
    ))
    _handle("portfolio_items", lambda data: _save_portfolio_items(pwb_unit, data))
    _handle("custom_sections", lambda data: _save_custom_sections(pwb_unit, data))


def _save_portfolio_items(pwb_unit, items_data):
    submitted_ids = {d["id"] for d in items_data if "id" in d}
    pwb_unit.portfolio_items.exclude(pk__in=submitted_ids).delete()
    for item_data in items_data:
        item_id = item_data.pop("id", None)
        links_data = item_data.pop("links", [])
        if item_id:
            item = PortfolioItem.objects.filter(pk=item_id, pwb_unit=pwb_unit).first()
            if item:
                for attr, val in item_data.items():
                    setattr(item, attr, val)
                item.save(update_fields=list(item_data.keys()))
            else:
                item = PortfolioItem.objects.create(pwb_unit=pwb_unit, **item_data)
        else:
            item = PortfolioItem.objects.create(pwb_unit=pwb_unit, **item_data)
        item.links.all().delete()
        if links_data:
            PortfolioItemLink.objects.bulk_create([
                PortfolioItemLink(portfolio_item=item, **ld) for ld in links_data
            ])


def _save_certifications(pwb_unit, certs_data):
    submitted_ids = {d["id"] for d in certs_data if "id" in d}
    pwb_unit.certifications.exclude(pk__in=submitted_ids).delete()
    for cert_data in certs_data:
        cert_id = cert_data.pop("id", None)
        if cert_id:
            cert = Certification.objects.filter(pk=cert_id, pwb_unit=pwb_unit).first()
            if cert:
                for attr, val in cert_data.items():
                    setattr(cert, attr, val)
                cert.save(update_fields=list(cert_data.keys()))
            else:
                Certification.objects.create(pwb_unit=pwb_unit, **cert_data)
        else:
            Certification.objects.create(pwb_unit=pwb_unit, **cert_data)


def _save_custom_sections(pwb_unit, sections_data):
    pwb_unit.custom_sections.all().delete()
    sections_to_create = []
    items_per_section = []
    for section_data in sections_data:
        items_per_section.append(section_data.pop("items", []))
        sections_to_create.append(CustomSection(pwb_unit=pwb_unit, **section_data))
    created = CustomSection.objects.bulk_create(sections_to_create)
    all_items = [
        CustomSectionItem(section=section, **item_data)
        for section, items in zip(created, items_per_section)
        for item_data in items
    ]
    if all_items:
        CustomSectionItem.objects.bulk_create(all_items)


# ---------------------------------------------------------------------------
# Create serializer
# ---------------------------------------------------------------------------

class PWBUnitCreateSerializer(serializers.ModelSerializer):
    skills           = SkillWriteSerializer(many=True, required=False)
    links            = LinkWriteSerializer(many=True, required=False)
    languages        = LanguageWriteSerializer(many=True, required=False)
    experience_units = ExperienceUnitWriteSerializer(many=True, required=False)
    education_units  = EducationUnitWriteSerializer(many=True, required=False)
    portfolio_items  = PortfolioItemWriteSerializer(many=True, required=False)
    certifications   = CertificationWriteSerializer(many=True, required=False)
    awards           = AwardWriteSerializer(many=True, required=False)
    custom_sections  = CustomSectionWriteSerializer(many=True, required=False)

    class Meta:
        model = PWBUnit
        fields = [
            "unit_name",
            "first_name", "last_name", "headline", "email", "phone", "location", "about",
            "template",
            "skills", "links", "languages", "experience_units", "education_units",
            "portfolio_items", "certifications", "awards", "custom_sections",
        ]

    def create(self, validated_data):
        nested = _build_nested_kwargs(None, validated_data)
        with transaction.atomic():
            pwb_unit = PWBUnit.objects.create(**validated_data)
            _save_nested(pwb_unit, nested, replace=True)
        return pwb_unit


# ---------------------------------------------------------------------------
# Update serializer  (no unit_name — it's the URL identifier)
# ---------------------------------------------------------------------------

class PWBUnitUpdateSerializer(serializers.ModelSerializer):
    skills           = SkillWriteSerializer(many=True, required=False)
    links            = LinkWriteSerializer(many=True, required=False)
    languages        = LanguageWriteSerializer(many=True, required=False)
    experience_units = ExperienceUnitWriteSerializer(many=True, required=False)
    education_units  = EducationUnitWriteSerializer(many=True, required=False)
    portfolio_items  = PortfolioItemWriteSerializer(many=True, required=False)
    certifications   = CertificationWriteSerializer(many=True, required=False)
    awards           = AwardWriteSerializer(many=True, required=False)
    custom_sections  = CustomSectionWriteSerializer(many=True, required=False)

    class Meta:
        model = PWBUnit
        fields = [
            "first_name", "last_name", "headline", "email", "phone", "location", "about",
            "template",
            "skills", "links", "languages", "experience_units", "education_units",
            "portfolio_items", "certifications", "awards", "custom_sections",
        ]

    def update(self, instance, validated_data):
        nested = _build_nested_kwargs(None, validated_data)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        with transaction.atomic():
            instance.save()
            # replace=False: only touch relations that were explicitly sent
            _save_nested(instance, nested, replace=False)
        return instance
