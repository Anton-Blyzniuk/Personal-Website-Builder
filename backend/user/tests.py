import io

from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from user.models import APICredential, User

REGISTER_URL    = "/api/v1/user/register/"
TOKEN_URL       = "/api/v1/token/"
MY_INFO_URL     = "/api/v1/user/my-info/"
CHANGE_PASS_URL = "/api/v1/user/change-password/"
API_KEY_URL     = "/api/v1/user/api-key/"
API_KEY_ROT_URL = "/api/v1/user/api-key/rotate/"

MOCK_CLOUDINARY_RESULT = {
    "public_id": "profile_pictures/test_avatar",
    "version": 1234567890,
    "signature": "abc123",
    "width": 100,
    "height": 100,
    "format": "jpg",
    "type": "upload",
    "resource_type": "image",
    "url": "http://res.cloudinary.com/demo/image/upload/profile_pictures/test_avatar.jpg",
    "secure_url": "https://res.cloudinary.com/demo/image/upload/profile_pictures/test_avatar.jpg",
}


def _make_image_file(name="test.jpg", fmt="JPEG"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color=(255, 0, 0)).save(buf, format=fmt)
    buf.seek(0)
    buf.name = name
    return buf


class BaseTest(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email="user@example.com",
            password="StrongPass1!",
            first_name="Jane",
            last_name="Doe",
        )
        self._authenticate(self.user)

    def _authenticate(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

@override_settings(
    REST_FRAMEWORK={
        **{"DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"]},
        "DEFAULT_THROTTLE_RATES": {"registration": "3/minute"},
    }
)
class RegistrationTests(APITestCase):
    def setUp(self):
        cache.clear()

    def _payload(self, email="new@example.com"):
        return {
            "email": email,
            "password": "StrongPass1!",
            "first_name": "John",
            "last_name": "Smith",
        }

    def test_register_success(self):
        res = self.client.post(REGISTER_URL, self._payload())
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertTrue(User.objects.filter(email="new@example.com").exists())

    def test_register_duplicate_email(self):
        User.objects.create_user(email="dup@example.com", password="X", first_name="A", last_name="B")
        res = self.client.post(REGISTER_URL, self._payload(email="dup@example.com"))
        self.assertEqual(res.status_code, 400)

    def test_register_weak_password(self):
        payload = self._payload()
        payload["password"] = "123"
        res = self.client.post(REGISTER_URL, payload)
        self.assertEqual(res.status_code, 400)

    def test_register_missing_fields(self):
        res = self.client.post(REGISTER_URL, {"email": "a@b.com"})
        self.assertEqual(res.status_code, 400)


# ---------------------------------------------------------------------------
# Token
# ---------------------------------------------------------------------------

class TokenTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email="token@example.com",
            password="StrongPass1!",
            first_name="T",
            last_name="U",
        )

    def test_obtain_token_success(self):
        res = self.client.post(TOKEN_URL, {"email": "token@example.com", "password": "StrongPass1!"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_obtain_token_wrong_password(self):
        res = self.client.post(TOKEN_URL, {"email": "token@example.com", "password": "wrong"})
        self.assertEqual(res.status_code, 401)

    def test_refresh_token(self):
        obtain = self.client.post(TOKEN_URL, {"email": "token@example.com", "password": "StrongPass1!"})
        res = self.client.post("/api/v1/token/refresh/", {"refresh": obtain.data["refresh"]})
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)


# ---------------------------------------------------------------------------
# My Info
# ---------------------------------------------------------------------------

class MyInfoTests(BaseTest):
    def test_get_my_info(self):
        res = self.client.get(MY_INFO_URL)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["email"], "user@example.com")
        self.assertEqual(res.data["first_name"], "Jane")

    def test_get_unauthenticated(self):
        self.client.credentials()
        res = self.client.get(MY_INFO_URL)
        self.assertEqual(res.status_code, 401)

    def test_patch_name(self):
        res = self.client.patch(MY_INFO_URL, {"first_name": "Updated"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["first_name"], "Updated")
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")

    def test_patch_partial_only_last_name(self):
        res = self.client.patch(MY_INFO_URL, {"last_name": "NewLast"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["last_name"], "NewLast")
        self.assertEqual(res.data["first_name"], "Jane")

    def test_patch_profile_picture(self):
        from unittest.mock import patch as mock_patch
        img = _make_image_file()
        with mock_patch("cloudinary.uploader.upload", return_value=MOCK_CLOUDINARY_RESULT):
            res = self.client.patch(MY_INFO_URL, {"profile_picture": img}, format="multipart")
        self.assertEqual(res.status_code, 200)


# ---------------------------------------------------------------------------
# Change Password
# ---------------------------------------------------------------------------

class ChangePasswordTests(BaseTest):
    def test_change_password_success(self):
        res = self.client.post(
            CHANGE_PASS_URL,
            {"current_password": "StrongPass1!", "new_password": "NewStrong2@"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStrong2@"))

    def test_change_password_wrong_current(self):
        res = self.client.post(
            CHANGE_PASS_URL,
            {"current_password": "wrong", "new_password": "NewStrong2@"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_change_password_weak_new(self):
        res = self.client.post(
            CHANGE_PASS_URL,
            {"current_password": "StrongPass1!", "new_password": "123"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_change_password_unauthenticated(self):
        self.client.credentials()
        res = self.client.post(
            CHANGE_PASS_URL,
            {"current_password": "StrongPass1!", "new_password": "NewStrong2@"},
            format="json",
        )
        self.assertEqual(res.status_code, 401)


# ---------------------------------------------------------------------------
# API Credentials
# ---------------------------------------------------------------------------

class APICredentialTests(BaseTest):
    def test_get_no_credentials(self):
        res = self.client.get(API_KEY_URL)
        self.assertEqual(res.status_code, 404)

    def test_create_credentials(self):
        res = self.client.post(API_KEY_URL)
        self.assertEqual(res.status_code, 201)
        self.assertIn("key", res.data)
        self.assertIn("secret", res.data)
        self.assertIn("created_at", res.data)
        self.assertTrue(APICredential.objects.filter(user=self.user).exists())

    def test_get_credentials_after_create(self):
        self.client.post(API_KEY_URL)
        res = self.client.get(API_KEY_URL)
        self.assertEqual(res.status_code, 200)
        self.assertIn("key", res.data)
        self.assertNotIn("secret", res.data)

    def test_create_duplicate_returns_409(self):
        self.client.post(API_KEY_URL)
        res = self.client.post(API_KEY_URL)
        self.assertEqual(res.status_code, 409)

    def test_delete_credentials(self):
        self.client.post(API_KEY_URL)
        res = self.client.delete(API_KEY_URL)
        self.assertEqual(res.status_code, 204)
        self.assertFalse(APICredential.objects.filter(user=self.user).exists())

    def test_delete_no_credentials(self):
        res = self.client.delete(API_KEY_URL)
        self.assertEqual(res.status_code, 404)

    def test_rotate_secret(self):
        create_res = self.client.post(API_KEY_URL)
        original_key = create_res.data["key"]

        rotate_res = self.client.post(API_KEY_ROT_URL)
        self.assertEqual(rotate_res.status_code, 200)
        self.assertIn("secret", rotate_res.data)
        self.assertEqual(rotate_res.data["key"], original_key)
        self.assertNotEqual(rotate_res.data["secret"], create_res.data["secret"])

    def test_rotate_no_credentials(self):
        res = self.client.post(API_KEY_ROT_URL)
        self.assertEqual(res.status_code, 404)

    def test_api_key_authentication(self):
        create_res = self.client.post(API_KEY_URL)
        key = create_res.data["key"]
        secret = create_res.data["secret"]

        self.client.credentials()
        res = self.client.get(
            MY_INFO_URL,
            HTTP_X_API_KEY=key,
            HTTP_X_API_SECRET=secret,
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["email"], "user@example.com")

    def test_api_key_wrong_secret(self):
        create_res = self.client.post(API_KEY_URL)
        key = create_res.data["key"]

        self.client.credentials()
        res = self.client.get(
            MY_INFO_URL,
            HTTP_X_API_KEY=key,
            HTTP_X_API_SECRET="wrong_secret",
        )
        self.assertEqual(res.status_code, 401)

    def test_api_key_invalid_key(self):
        self.client.credentials()
        res = self.client.get(
            MY_INFO_URL,
            HTTP_X_API_KEY="nonexistent_key",
            HTTP_X_API_SECRET="some_secret",
        )
        self.assertEqual(res.status_code, 401)

    def test_api_key_partial_headers_rejected(self):
        self.client.credentials()
        res = self.client.get(MY_INFO_URL, HTTP_X_API_KEY="only_key")
        self.assertEqual(res.status_code, 401)
