from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user.serializers import UserRetrieveSerializer


class MyInfoView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="My Info",
        description="See your profile information, just pass access token in headers.",
        responses={
            200: OpenApiResponse(description="See your data"),
            400: OpenApiResponse(description="Token wasn't provided or invalid."),
        },
        tags=["users"],
    )
    def get(self, request):
        user = UserRetrieveSerializer(request.user).data
        return Response(user, status=status.HTTP_200_OK)
