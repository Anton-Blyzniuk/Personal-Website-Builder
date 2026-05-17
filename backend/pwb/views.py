from django.db.models import Prefetch
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.mixins import (CreateModelMixin, DestroyModelMixin,
                                   ListModelMixin, RetrieveModelMixin,
                                   UpdateModelMixin)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from user.models import User
from .models import CustomSection, PortfolioItem, PWBUnit
from .permissions import IsOwner
from .serializers import (PWBUnitCreateSerializer, PWBUnitListSerializer,
                           PWBUnitSerializer, PWBUnitUpdateSerializer)


@extend_schema(
    summary="Health check", description="Returns API health status", tags=["health"]
)
@api_view(["GET"])
def ping(request):
    return Response({"ping": "pong"}, status=status.HTTP_200_OK)


def _full_queryset():
    return (
        PWBUnit.objects.all()
        .select_related("owner")
        .prefetch_related(
            "links",
            "skills",
            "languages",
            "experience_units",
            "education_units",
            "photos",
            "certifications",
            "awards",
            Prefetch("portfolio_items", queryset=PortfolioItem.objects.prefetch_related("links")),
            Prefetch("custom_sections", queryset=CustomSection.objects.prefetch_related("items")),
        )
    )


class PWBUnitViewSet(
    CreateModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    queryset = _full_queryset()  # used for schema generation & model introspection
    lookup_field = "unit_name"
    lookup_url_kwarg = "unit_name"

    # ------------------------------------------------------------------
    # Routing helpers
    # ------------------------------------------------------------------

    def get_queryset(self):
        if self.action == "list":
            return PWBUnit.objects.filter(owner=self.request.user)
        return _full_queryset()

    def get_serializer_class(self):
        if self.action == "create":
            return PWBUnitCreateSerializer
        if self.action in ("update", "partial_update"):
            return PWBUnitUpdateSerializer
        if self.action == "list":
            return PWBUnitListSerializer
        return PWBUnitSerializer

    def get_permissions(self):
        if self.action == "retrieve":
            return [AllowAny()]
        if self.action in ("update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsOwner()]
        return [IsAuthenticated()]  # list, create

    # ------------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------------

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        limit = User.PLAN_LIMITS.get(request.user.plan)
        if limit is not None:
            count = PWBUnit.objects.filter(owner=request.user).count()
            if count >= limit:
                return Response(
                    {"detail": f"Your {request.user.get_plan_display()} plan allows up to {limit} PWBUnit(s). Contact bliznukantonmain@gmail.com to upgrade."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = _full_queryset().get(pk=serializer.instance.pk)
        response = PWBUnitSerializer(instance, context=self.get_serializer_context())
        return Response(response.data, status=status.HTTP_201_CREATED,
                        headers=self.get_success_headers(response.data))

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        is_owner = request.user.is_authenticated and instance.owner == request.user
        # Only count authenticated non-owner callers as API reads.
        # Anonymous web visitors are tracked separately by the CV page via /track/.
        if request.user.is_authenticated and not is_owner:
            from .analytics_views import record_view
            record_view(instance, request, source='api')
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial  = kwargs.pop("partial", False)
        instance = self.get_object()  # enforces IsOwner object permission
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        instance = _full_queryset().get(pk=instance.pk)
        return Response(PWBUnitSerializer(instance, context=self.get_serializer_context()).data)
