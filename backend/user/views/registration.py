from drf_spectacular.utils import (OpenApiExample, OpenApiResponse,
                                   extend_schema)
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from user.serializers import AdminRegisterSerializer, UserRegisterSerializer
from .auth import RegistrationThrottle


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegistrationThrottle]

    @extend_schema(
        summary="Register user",
        description="Register a user.",
        request=UserRegisterSerializer,
        responses={
            201: OpenApiResponse(
                description="User registered successfully",
                examples=[
                    OpenApiExample(
                        "Success",
                        value={
                            "refresh": "<token>",
                            "access": "<access>",
                        },
                    )
                ],
            ),
            400: OpenApiResponse(description="Validation error"),
        },
        tags=["registration"],
    )
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = TokenObtainPairSerializer.get_token(user)

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class AdminRegistrationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegistrationThrottle]

    @extend_schema(
        summary="Register admin",
        description="Register an admin.",
        request=AdminRegisterSerializer,
        responses={
            201: OpenApiResponse(
                description="Admin registered successfully",
                examples=[
                    OpenApiExample(
                        "Success",
                        value={
                            "refresh": "<token>",
                            "access": "<access>",
                        },
                    )
                ],
            ),
            400: OpenApiResponse(description="Validation error"),
        },
        tags=["registration"],
    )
    def post(self, request):
        serializer = AdminRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = TokenObtainPairSerializer.get_token(user)

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED
        )
