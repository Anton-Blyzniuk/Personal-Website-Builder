from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from .models import PWBUnit
from .serializers import PWBUnitSerializer


@extend_schema(
    summary="Health check", description="Returns API health status", tags=["health"]
)
@api_view(["GET"])
def ping(request):
    return Response({"ping": "pong"}, status=status.HTTP_200_OK)


class PWBUnitViewSet(RetrieveModelMixin, GenericViewSet):
    queryset = (
        PWBUnit.objects.all()
        .select_related("owner")
        .prefetch_related(
            "links",
            "skills",
            "languages",
            "experience_units",
            "education_units",
            "photos",
            "projects",
        )
    )
    serializer_class = PWBUnitSerializer
    lookup_field = "unit_name"
    lookup_url_kwarg = "unit_name"
