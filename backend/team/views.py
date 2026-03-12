from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets

from .models import Teammate
from .permissions import IsAdminOrReadOnly
from .serializers import TeammateListSerializer, TeammateRetrieveSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List all teammates",
        tags=["Teammates"],
    ),
    retrieve=extend_schema(
        summary="Retrieve a teammate",
        tags=["Teammates"],
    ),
)
class TeammateViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    queryset = (
        Teammate.objects.all()
        .prefetch_related("links")
        .prefetch_related("project_roles")
    )
    pagination_class = None
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action in {"retrieve", "update", "partial_update"}:
            return TeammateRetrieveSerializer
        return TeammateListSerializer

