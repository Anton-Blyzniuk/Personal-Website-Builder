from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user.serializers import UserRetrieveSerializer, UserUpdateSerializer


class MyInfoView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @extend_schema(
        summary="My Info",
        description="Get your profile information.",
        responses={200: UserRetrieveSerializer, 401: OpenApiResponse(description="Unauthenticated")},
        tags=["users"],
    )
    def get(self, request):
        return Response(UserRetrieveSerializer(request.user).data)

    @extend_schema(
        summary="Update profile",
        description="Update your first name, last name, or profile picture. Send as JSON or multipart/form-data.",
        request=UserUpdateSerializer,
        responses={200: UserRetrieveSerializer, 400: OpenApiResponse(description="Validation error")},
        tags=["users"],
    )
    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserRetrieveSerializer(request.user).data, status=status.HTTP_200_OK)
