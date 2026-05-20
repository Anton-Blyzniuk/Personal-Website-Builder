from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .analytics_views import AnalyticsAPIView, TrackEngagementAPIView, TrackViewAPIView
from .media_views import (CertificationImageView, EducationUnitImageView,
                           PDFResumeView, PhotoDetailView, PhotoListCreateView,
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

    # Certification image
    path("pwbunits/<slug:unit_name>/certifications/<int:pk>/image/",
         CertificationImageView.as_view(), name="certification-image"),

    # Analytics
    path("pwbunits/<slug:unit_name>/track/",
         TrackViewAPIView.as_view(), name="pwbunit-track"),
    path("pwbunits/<slug:unit_name>/track-engagement/",
         TrackEngagementAPIView.as_view(), name="pwbunit-track-engagement"),
    path("pwbunits/<slug:unit_name>/analytics/",
         AnalyticsAPIView.as_view(), name="pwbunit-analytics"),
]
