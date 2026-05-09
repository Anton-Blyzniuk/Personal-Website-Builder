from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Certification, EducationUnit, Photo, PortfolioItem, PWBUnit
from .serializers import PhotoSerializer

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


class _OwnedUnitMixin:
    def _get_owned_unit(self, unit_name):
        unit = get_object_or_404(PWBUnit, unit_name=unit_name)
        if unit.owner != self.request.user:
            raise PermissionDenied()
        return unit


# ---------------------------------------------------------------------------
# Photos
# ---------------------------------------------------------------------------

class PhotoListCreateView(_OwnedUnitMixin, APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="List photos",
        description="List all photos for the authenticated owner's PWBUnit.",
        responses={200: PhotoSerializer(many=True)},
        tags=["media"],
    )
    def get(self, request, unit_name):
        pwb_unit = self._get_owned_unit(unit_name)
        photos = pwb_unit.photos.all()
        return Response(PhotoSerializer(photos, many=True).data)

    @extend_schema(
        summary="Upload photo",
        description=(
            "Upload a photo for a PWBUnit. "
            "Send as multipart/form-data with field `image`. "
            "Optionally pass `is_main=true` to mark it as the main photo."
        ),
        responses={
            201: PhotoSerializer,
            400: OpenApiResponse(description="No file or unsupported format"),
            403: OpenApiResponse(description="Not the owner"),
        },
        tags=["media"],
    )
    def post(self, request, unit_name):
        pwb_unit = self._get_owned_unit(unit_name)

        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"image": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        if image_file.content_type not in _ALLOWED_IMAGE_TYPES:
            return Response(
                {"image": "Unsupported format. Use JPEG, PNG, WebP or GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_main_raw = request.data.get("is_main", "false")
        is_main = str(is_main_raw).lower() in ("true", "1", "yes")

        photo = Photo(pwb_unit=pwb_unit, is_main=is_main)
        photo.image = image_file
        photo.save()  # Photo.save() atomically handles single-main invariant
        return Response(PhotoSerializer(photo).data, status=status.HTTP_201_CREATED)


class PhotoDetailView(_OwnedUnitMixin, APIView):
    permission_classes = [IsAuthenticated]

    def _get_photo(self, unit_name, pk):
        pwb_unit = self._get_owned_unit(unit_name)
        return get_object_or_404(Photo, pk=pk, pwb_unit=pwb_unit)

    @extend_schema(
        summary="Set photo as main",
        description="Update a photo's `is_main` flag. Setting to true demotes all other photos.",
        responses={200: PhotoSerializer, 403: OpenApiResponse(description="Not the owner")},
        tags=["media"],
    )
    def patch(self, request, unit_name, pk):
        photo = self._get_photo(unit_name, pk)

        is_main_raw = request.data.get("is_main")
        if is_main_raw is None:
            return Response({"is_main": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)

        photo.is_main = str(is_main_raw).lower() in ("true", "1", "yes")
        photo.save()
        return Response(PhotoSerializer(photo).data)

    @extend_schema(
        summary="Delete photo",
        responses={204: None, 403: OpenApiResponse(description="Not the owner")},
        tags=["media"],
    )
    def delete(self, request, unit_name, pk):
        photo = self._get_photo(unit_name, pk)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# PDF resume
# ---------------------------------------------------------------------------

class PDFResumeView(_OwnedUnitMixin, APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Upload PDF resume",
        description="Upload or replace the PDF resume for a PWBUnit. Send as multipart/form-data with field `file`.",
        responses={
            200: OpenApiResponse(description="Upload successful, returns download URL"),
            400: OpenApiResponse(description="No file or not a PDF"),
            403: OpenApiResponse(description="Not the owner"),
        },
        tags=["media"],
    )
    def post(self, request, unit_name):
        pwb_unit = self._get_owned_unit(unit_name)

        pdf_file = request.FILES.get("file")
        if not pdf_file:
            return Response({"file": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        if pdf_file.content_type != "application/pdf":
            return Response({"file": "Only PDF files are accepted."}, status=status.HTTP_400_BAD_REQUEST)

        pwb_unit.pdf_resume = pdf_file
        pwb_unit.save(update_fields=["pdf_resume"])

        url = None
        if pwb_unit.pdf_resume:
            url = pwb_unit.pdf_resume.url.replace("/upload/", "/upload/fl_attachment/").replace("http://", "https://")
        return Response({"pdf_resume": url})

    @extend_schema(
        summary="Remove PDF resume",
        responses={204: None, 403: OpenApiResponse(description="Not the owner")},
        tags=["media"],
    )
    def delete(self, request, unit_name):
        pwb_unit = self._get_owned_unit(unit_name)
        pwb_unit.pdf_resume = None
        pwb_unit.save(update_fields=["pdf_resume"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# EducationUnit image
# ---------------------------------------------------------------------------

class EducationUnitImageView(_OwnedUnitMixin, APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _get_edu_unit(self, unit_name, pk):
        pwb_unit = self._get_owned_unit(unit_name)
        return get_object_or_404(EducationUnit, pk=pk, pwb_unit=pwb_unit)

    @extend_schema(
        summary="Upload education unit image",
        description="Upload or replace the image for a specific EducationUnit.",
        responses={
            200: OpenApiResponse(description="Returns updated image URL"),
            400: OpenApiResponse(description="No file or unsupported format"),
            403: OpenApiResponse(description="Not the owner"),
        },
        tags=["media"],
    )
    def post(self, request, unit_name, pk):
        edu_unit = self._get_edu_unit(unit_name, pk)

        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"image": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        if image_file.content_type not in _ALLOWED_IMAGE_TYPES:
            return Response(
                {"image": "Unsupported format. Use JPEG, PNG, WebP or GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        edu_unit.image = image_file
        edu_unit.save(update_fields=["image"])
        return Response({"image": edu_unit.image.url if edu_unit.image else None})

    @extend_schema(
        summary="Remove education unit image",
        responses={204: None, 403: OpenApiResponse(description="Not the owner")},
        tags=["media"],
    )
    def delete(self, request, unit_name, pk):
        edu_unit = self._get_edu_unit(unit_name, pk)
        edu_unit.image = None
        edu_unit.save(update_fields=["image"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# PortfolioItem image
# ---------------------------------------------------------------------------

class PortfolioItemImageView(_OwnedUnitMixin, APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _get_portfolio_item(self, unit_name, pk):
        pwb_unit = self._get_owned_unit(unit_name)
        return get_object_or_404(PortfolioItem, pk=pk, pwb_unit=pwb_unit)

    @extend_schema(
        summary="Upload portfolio item image",
        description="Upload or replace the image for a specific PortfolioItem.",
        responses={
            200: OpenApiResponse(description="Returns updated image URL"),
            400: OpenApiResponse(description="No file or unsupported format"),
            403: OpenApiResponse(description="Not the owner"),
        },
        tags=["media"],
    )
    def post(self, request, unit_name, pk):
        item = self._get_portfolio_item(unit_name, pk)

        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"image": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        if image_file.content_type not in _ALLOWED_IMAGE_TYPES:
            return Response(
                {"image": "Unsupported format. Use JPEG, PNG, WebP or GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.image = image_file
        item.save(update_fields=["image"])
        return Response({"image": item.image.url if item.image else None})

    @extend_schema(
        summary="Remove portfolio item image",
        responses={204: None, 403: OpenApiResponse(description="Not the owner")},
        tags=["media"],
    )
    def delete(self, request, unit_name, pk):
        item = self._get_portfolio_item(unit_name, pk)
        item.image = None
        item.save(update_fields=["image"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Certification image
# ---------------------------------------------------------------------------

class CertificationImageView(_OwnedUnitMixin, APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _get_certification(self, unit_name, pk):
        pwb_unit = self._get_owned_unit(unit_name)
        return get_object_or_404(Certification, pk=pk, pwb_unit=pwb_unit)

    @extend_schema(
        summary="Upload certification image",
        description="Upload or replace the image for a specific Certification.",
        responses={
            200: OpenApiResponse(description="Returns updated image URL"),
            400: OpenApiResponse(description="No file or unsupported format"),
            403: OpenApiResponse(description="Not the owner"),
        },
        tags=["media"],
    )
    def post(self, request, unit_name, pk):
        cert = self._get_certification(unit_name, pk)

        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"image": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        if image_file.content_type not in _ALLOWED_IMAGE_TYPES:
            return Response(
                {"image": "Unsupported format. Use JPEG, PNG, WebP or GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cert.image = image_file
        cert.save(update_fields=["image"])
        return Response({"image": cert.image.url if cert.image else None})

    @extend_schema(
        summary="Remove certification image",
        responses={204: None, 403: OpenApiResponse(description="Not the owner")},
        tags=["media"],
    )
    def delete(self, request, unit_name, pk):
        cert = self._get_certification(unit_name, pk)
        cert.image = None
        cert.save(update_fields=["image"])
        return Response(status=status.HTTP_204_NO_CONTENT)
