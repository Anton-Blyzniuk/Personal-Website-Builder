from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .media_views import (EducationUnitImageView, PDFResumeView,
                           PhotoDetailView, PhotoListCreateView,
                           PortfolioItemImageView)
from .views import PWBUnitViewSet, ping

router = DefaultRouter()
router.register("pwbunits", PWBUnitViewSet, "pwbunit")

urlpatterns = [
    path("ping/", ping, name="ping"),
    path("", include(router.urls)),

    # Photos
    path("pwbunits/<slug:unit_name>/photos/",
         PhotoListCreateView.as_view(), name="pwbunit-photos"),
    path("pwbunits/<slug:unit_name>/photos/<int:pk>/",
         PhotoDetailView.as_view(), name="pwbunit-photo-detail"),

    # PDF resume
    path("pwbunits/<slug:unit_name>/pdf-resume/",
         PDFResumeView.as_view(), name="pwbunit-pdf-resume"),

    # Education unit image
    path("pwbunits/<slug:unit_name>/education-units/<int:pk>/image/",
         EducationUnitImageView.as_view(), name="education-unit-image"),

    # Portfolio item image
    path("pwbunits/<slug:unit_name>/portfolio-items/<int:pk>/image/",
         PortfolioItemImageView.as_view(), name="portfolio-item-image"),
]
