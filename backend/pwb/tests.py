import io
from unittest.mock import patch as mock_patch

from django.core.cache import cache
from PIL import Image
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from pwb.models import EducationUnit, Photo, PortfolioItem, PWBUnit
from user.models import User

PWBUNITS_URL = "/api/v1/pwbunits/"

MOCK_CLOUDINARY_IMAGE = {
    "public_id": "test/img",
    "version": 1,
    "type": "upload",
    "url": "http://res.cloudinary.com/demo/image/upload/test/img.jpg",
    "secure_url": "https://res.cloudinary.com/demo/image/upload/test/img.jpg",
    "format": "jpg",
    "resource_type": "image",
    "width": 100,
    "height": 100,
}

MOCK_CLOUDINARY_RAW = {
    **MOCK_CLOUDINARY_IMAGE,
    "type": "upload",
    "resource_type": "raw",
    "public_id": "test/resume.pdf",
    "url": "http://res.cloudinary.com/demo/raw/upload/test/resume.pdf",
    "secure_url": "https://res.cloudinary.com/demo/raw/upload/test/resume.pdf",
}

FULL_PAYLOAD = {
    "unit_name": "john-doe",
    "first_name": "John",
    "last_name": "Doe",
    "headline": "Software Engineer",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "New York",
    "about": "About me",
    "skills": [{"name": "Python", "category": "Backend", "level": "Expert", "order": 0}],
    "links": [{"name": "GitHub", "url": "https://github.com/johndoe"}],
    "languages": [{"name": "English", "level": "Native"}],
    "experience_units": [
        {
            "title": "Senior Engineer",
            "organization": "Acme Corp",
            "location": "NY",
            "description": "Built things",
            "from_date": "2020-01-01",
            "to_date": None,
            "order": 0,
        }
    ],
    "education_units": [
        {
            "institution": "MIT",
            "degree": "BSc",
            "field_of_study": "CS",
            "from_date": "2015-09-01",
            "to_date": "2019-06-01",
            "order": 0,
        }
    ],
    "portfolio_items": [
        {
            "title": "My App",
            "category": "Web",
            "description": "A web app",
            "date": "2023-05-01",
            "order": 0,
            "links": [{"name": "Live", "url": "https://myapp.example.com"}],
        }
    ],
    "certifications": [
        {
            "name": "AWS Certified",
            "issuing_organization": "Amazon",
            "issue_date": "2022-01-01",
            "order": 0,
        }
    ],
    "awards": [{"title": "Best Dev", "issuer": "DevConf", "date": "2023-06-01", "order": 0}],
    "custom_sections": [
        {
            "title": "Publications",
            "order": 0,
            "items": [{"title": "My Paper", "subtitle": "Journal", "order": 0}],
        }
    ],
}


def _make_image_file(name="test.jpg", fmt="JPEG", content_type="image/jpeg"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color=(100, 200, 50)).save(buf, format=fmt)
    buf.seek(0)
    buf.name = name
    buf.content_type = content_type
    return buf


def _make_pdf_file():
    buf = io.BytesIO(b"%PDF-1.4 minimal")
    buf.seek(0)
    buf.name = "resume.pdf"
    buf.content_type = "application/pdf"
    return buf


class BaseTest(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email="owner@example.com",
            password="StrongPass1!",
            first_name="Owner",
            last_name="User",
        )
        self.other = User.objects.create_user(
            email="other@example.com",
            password="StrongPass1!",
            first_name="Other",
            last_name="User",
        )
        self._authenticate(self.user)

    def _authenticate(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

    def _create_unit(self, unit_name="test-unit", owner=None):
        return PWBUnit.objects.create(
            unit_name=unit_name,
            owner=owner or self.user,
            first_name="Test",
            last_name="Unit",
            headline="Headline",
            email="test@example.com",
        )


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class PWBUnitCreateTests(BaseTest):
    def test_create_full_payload(self):
        res = self.client.post(PWBUNITS_URL, FULL_PAYLOAD, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        unit = PWBUnit.objects.get(unit_name="john-doe")
        self.assertEqual(unit.owner, self.user)
        self.assertEqual(unit.skills.count(), 1)
        self.assertEqual(unit.links.count(), 1)
        self.assertEqual(unit.experience_units.count(), 1)
        self.assertEqual(unit.education_units.count(), 1)
        self.assertEqual(unit.portfolio_items.count(), 1)
        self.assertEqual(unit.portfolio_items.first().links.count(), 1)
        self.assertEqual(unit.certifications.count(), 1)
        self.assertEqual(unit.awards.count(), 1)
        self.assertEqual(unit.custom_sections.count(), 1)
        self.assertEqual(unit.custom_sections.first().items.count(), 1)

    def test_create_minimal_payload(self):
        payload = {
            "unit_name": "minimal-unit",
            "first_name": "Min",
            "last_name": "Mal",
            "headline": "Minimal",
            "email": "min@example.com",
        }
        res = self.client.post(PWBUNITS_URL, payload, format="json")
        self.assertEqual(res.status_code, 201, res.data)

    def test_create_duplicate_unit_name(self):
        self._create_unit("dup-unit")
        payload = {**FULL_PAYLOAD, "unit_name": "dup-unit"}
        res = self.client.post(PWBUNITS_URL, payload, format="json")
        self.assertEqual(res.status_code, 400)

    def test_create_unauthenticated(self):
        self.client.credentials()
        res = self.client.post(PWBUNITS_URL, FULL_PAYLOAD, format="json")
        self.assertEqual(res.status_code, 401)

    def test_create_sets_owner_automatically(self):
        payload = {
            "unit_name": "auto-owner",
            "first_name": "A",
            "last_name": "B",
            "headline": "H",
            "email": "a@b.com",
        }
        res = self.client.post(PWBUNITS_URL, payload, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(PWBUnit.objects.get(unit_name="auto-owner").owner, self.user)

    def test_create_date_validation_error(self):
        payload = {
            "unit_name": "bad-dates",
            "first_name": "A",
            "last_name": "B",
            "headline": "H",
            "email": "a@b.com",
            "experience_units": [
                {
                    "title": "Job",
                    "from_date": "2022-01-01",
                    "to_date": "2021-01-01",
                    "order": 0,
                }
            ],
        }
        res = self.client.post(PWBUNITS_URL, payload, format="json")
        self.assertEqual(res.status_code, 400)


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

class PWBUnitListTests(BaseTest):
    def test_list_only_own_units(self):
        self._create_unit("my-unit-1")
        self._create_unit("my-unit-2")
        self._create_unit("other-unit", owner=self.other)

        res = self.client.get(PWBUNITS_URL)
        self.assertEqual(res.status_code, 200)

        names = [u["unit_name"] for u in res.data.get("results", res.data)]
        self.assertIn("my-unit-1", names)
        self.assertIn("my-unit-2", names)
        self.assertNotIn("other-unit", names)

    def test_list_unauthenticated(self):
        self.client.credentials()
        res = self.client.get(PWBUNITS_URL)
        self.assertEqual(res.status_code, 401)

    def test_list_pagination_shape(self):
        for i in range(3):
            self._create_unit(f"unit-{i}")
        res = self.client.get(PWBUNITS_URL)
        self.assertEqual(res.status_code, 200)
        self.assertIn("count", res.data)
        self.assertIn("results", res.data)
        self.assertIn("next", res.data)
        self.assertIn("previous", res.data)


# ---------------------------------------------------------------------------
# Retrieve
# ---------------------------------------------------------------------------

class PWBUnitRetrieveTests(BaseTest):
    def test_retrieve_own_unit(self):
        unit = self._create_unit("retrieve-me")
        res = self.client.get(f"{PWBUNITS_URL}{unit.unit_name}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["unit_name"], "retrieve-me")

    def test_retrieve_other_user_unit_is_allowed(self):
        unit = self._create_unit("other-retrieve", owner=self.other)
        res = self.client.get(f"{PWBUNITS_URL}{unit.unit_name}/")
        self.assertEqual(res.status_code, 200)

    def test_retrieve_unauthenticated(self):
        unit = self._create_unit("public-unit")
        self.client.credentials()
        res = self.client.get(f"{PWBUNITS_URL}{unit.unit_name}/")
        self.assertEqual(res.status_code, 200)

    def test_retrieve_nonexistent(self):
        res = self.client.get(f"{PWBUNITS_URL}nonexistent/")
        self.assertEqual(res.status_code, 404)


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class PWBUnitUpdateTests(BaseTest):
    def test_patch_scalar_fields(self):
        unit = self._create_unit("patch-me")
        res = self.client.patch(
            f"{PWBUNITS_URL}{unit.unit_name}/",
            {"first_name": "Updated", "headline": "New Headline"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        unit.refresh_from_db()
        self.assertEqual(unit.first_name, "Updated")
        self.assertEqual(unit.headline, "New Headline")

    def test_patch_replaces_nested_array(self):
        unit = self._create_unit("patch-nested")
        from pwb.models import Skill
        Skill.objects.create(pwb_unit=unit, name="OldSkill", order=0)

        res = self.client.patch(
            f"{PWBUNITS_URL}{unit.unit_name}/",
            {"skills": [{"name": "NewSkill", "order": 0}]},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(unit.skills.count(), 1)
        self.assertEqual(unit.skills.first().name, "NewSkill")

    def test_patch_absent_nested_unchanged(self):
        unit = self._create_unit("patch-absent")
        from pwb.models import Skill
        Skill.objects.create(pwb_unit=unit, name="KeepMe", order=0)

        res = self.client.patch(
            f"{PWBUNITS_URL}{unit.unit_name}/",
            {"first_name": "Changed"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(unit.skills.count(), 1)

    def test_patch_other_user_unit_forbidden(self):
        unit = self._create_unit("other-patch", owner=self.other)
        res = self.client.patch(
            f"{PWBUNITS_URL}{unit.unit_name}/",
            {"first_name": "Hack"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_put_replaces_unit(self):
        unit = self._create_unit("put-me")
        payload = {
            "first_name": "Put",
            "last_name": "Updated",
            "headline": "Put headline",
            "email": "put@example.com",
            "skills": [],
        }
        res = self.client.put(f"{PWBUNITS_URL}{unit.unit_name}/", payload, format="json")
        self.assertEqual(res.status_code, 200)
        unit.refresh_from_db()
        self.assertEqual(unit.first_name, "Put")


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

class PWBUnitDeleteTests(BaseTest):
    def test_delete_own_unit(self):
        unit = self._create_unit("delete-me")
        res = self.client.delete(f"{PWBUNITS_URL}{unit.unit_name}/")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(PWBUnit.objects.filter(unit_name="delete-me").exists())

    def test_delete_other_user_unit_forbidden(self):
        unit = self._create_unit("other-delete", owner=self.other)
        res = self.client.delete(f"{PWBUNITS_URL}{unit.unit_name}/")
        self.assertEqual(res.status_code, 403)

    def test_delete_unauthenticated(self):
        unit = self._create_unit("unauth-delete")
        self.client.credentials()
        res = self.client.delete(f"{PWBUNITS_URL}{unit.unit_name}/")
        self.assertEqual(res.status_code, 401)


# ---------------------------------------------------------------------------
# Photos
# ---------------------------------------------------------------------------

class PhotoTests(BaseTest):
    def setUp(self):
        super().setUp()
        self.unit = self._create_unit("photo-unit")
        self.photos_url = f"{PWBUNITS_URL}{self.unit.unit_name}/photos/"

    def test_list_photos_empty(self):
        res = self.client.get(self.photos_url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, [])

    def test_upload_photo(self):
        img = _make_image_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_IMAGE):
            res = self.client.post(self.photos_url, {"image": img}, format="multipart")
        self.assertEqual(res.status_code, 201)
        self.assertIn("id", res.data)
        self.assertEqual(self.unit.photos.count(), 1)

    def test_upload_photo_as_main(self):
        img = _make_image_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_IMAGE):
            res = self.client.post(self.photos_url, {"image": img, "is_main": "true"}, format="multipart")
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["is_main"])

    def test_upload_invalid_content_type(self):
        buf = io.BytesIO(b"not an image")
        buf.name = "bad.txt"
        res = self.client.post(self.photos_url, {"image": buf}, format="multipart")
        self.assertEqual(res.status_code, 400)

    def test_upload_no_file(self):
        res = self.client.post(self.photos_url, {}, format="multipart")
        self.assertEqual(res.status_code, 400)

    def test_upload_other_user_unit_forbidden(self):
        other_unit = self._create_unit("other-photo-unit", owner=self.other)
        url = f"{PWBUNITS_URL}{other_unit.unit_name}/photos/"
        img = _make_image_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_IMAGE):
            res = self.client.post(url, {"image": img}, format="multipart")
        self.assertEqual(res.status_code, 403)

    def test_set_photo_as_main(self):
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_IMAGE):
            photo = Photo.objects.create(pwb_unit=self.unit, is_main=False)

        url = f"{self.photos_url}{photo.pk}/"
        res = self.client.patch(url, {"is_main": "true"}, format="json")
        self.assertEqual(res.status_code, 200)
        photo.refresh_from_db()
        self.assertTrue(photo.is_main)

    def test_delete_photo(self):
        photo = Photo.objects.create(pwb_unit=self.unit)
        url = f"{self.photos_url}{photo.pk}/"
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Photo.objects.filter(pk=photo.pk).exists())

    def test_only_one_main_photo(self):
        p1 = Photo.objects.create(pwb_unit=self.unit, is_main=True)
        p2 = Photo.objects.create(pwb_unit=self.unit, is_main=True)
        p1.refresh_from_db()
        self.assertFalse(p1.is_main)
        self.assertTrue(p2.is_main)


# ---------------------------------------------------------------------------
# PDF Resume
# ---------------------------------------------------------------------------

class PDFResumeTests(BaseTest):
    def setUp(self):
        super().setUp()
        self.unit = self._create_unit("pdf-unit")
        self.pdf_url = f"{PWBUNITS_URL}{self.unit.unit_name}/pdf-resume/"

    def test_upload_pdf(self):
        pdf = _make_pdf_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_RAW):
            res = self.client.post(self.pdf_url, {"file": pdf}, format="multipart")
        self.assertEqual(res.status_code, 200)
        self.assertIn("pdf_resume", res.data)

    def test_upload_non_pdf_rejected(self):
        img = _make_image_file()
        res = self.client.post(self.pdf_url, {"file": img}, format="multipart")
        self.assertEqual(res.status_code, 400)

    def test_upload_no_file(self):
        res = self.client.post(self.pdf_url, {}, format="multipart")
        self.assertEqual(res.status_code, 400)

    def test_delete_pdf(self):
        pdf = _make_pdf_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_RAW):
            self.client.post(self.pdf_url, {"file": pdf}, format="multipart")
        res = self.client.delete(self.pdf_url)
        self.assertEqual(res.status_code, 204)

    def test_upload_other_user_unit_forbidden(self):
        other_unit = self._create_unit("other-pdf-unit", owner=self.other)
        url = f"{PWBUNITS_URL}{other_unit.unit_name}/pdf-resume/"
        pdf = _make_pdf_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_RAW):
            res = self.client.post(url, {"file": pdf}, format="multipart")
        self.assertEqual(res.status_code, 403)


# ---------------------------------------------------------------------------
# Education Unit Image
# ---------------------------------------------------------------------------

class EducationUnitImageTests(BaseTest):
    def setUp(self):
        super().setUp()
        self.unit = self._create_unit("edu-img-unit")
        self.edu = EducationUnit.objects.create(
            pwb_unit=self.unit,
            institution="MIT",
            from_date="2018-09-01",
        )
        self.url = f"{PWBUNITS_URL}{self.unit.unit_name}/education-units/{self.edu.pk}/image/"

    def test_upload_image(self):
        img = _make_image_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_IMAGE):
            res = self.client.post(self.url, {"image": img}, format="multipart")
        self.assertEqual(res.status_code, 200)
        self.assertIn("image", res.data)

    def test_delete_image(self):
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, 204)

    def test_upload_other_user_unit_forbidden(self):
        other_unit = self._create_unit("other-edu-unit", owner=self.other)
        other_edu = EducationUnit.objects.create(
            pwb_unit=other_unit,
            institution="Harvard",
            from_date="2018-09-01",
        )
        url = f"{PWBUNITS_URL}{other_unit.unit_name}/education-units/{other_edu.pk}/image/"
        img = _make_image_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_IMAGE):
            res = self.client.post(url, {"image": img}, format="multipart")
        self.assertEqual(res.status_code, 403)


# ---------------------------------------------------------------------------
# Portfolio Item Image
# ---------------------------------------------------------------------------

class PortfolioItemImageTests(BaseTest):
    def setUp(self):
        super().setUp()
        self.unit = self._create_unit("port-img-unit")
        self.item = PortfolioItem.objects.create(
            pwb_unit=self.unit,
            title="My Project",
        )
        self.url = f"{PWBUNITS_URL}{self.unit.unit_name}/portfolio-items/{self.item.pk}/image/"

    def test_upload_image(self):
        img = _make_image_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_IMAGE):
            res = self.client.post(self.url, {"image": img}, format="multipart")
        self.assertEqual(res.status_code, 200)
        self.assertIn("image", res.data)

    def test_delete_image(self):
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, 204)

    def test_upload_invalid_format(self):
        buf = io.BytesIO(b"not an image")
        buf.name = "bad.txt"
        res = self.client.post(self.url, {"image": buf}, format="multipart")
        self.assertEqual(res.status_code, 400)

    def test_upload_other_user_item_forbidden(self):
        other_unit = self._create_unit("other-port-unit", owner=self.other)
        other_item = PortfolioItem.objects.create(pwb_unit=other_unit, title="Other Project")
        url = f"{PWBUNITS_URL}{other_unit.unit_name}/portfolio-items/{other_item.pk}/image/"
        img = _make_image_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_IMAGE):
            res = self.client.post(url, {"image": img}, format="multipart")
        self.assertEqual(res.status_code, 403)
