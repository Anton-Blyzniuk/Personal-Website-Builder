from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


class RegistrationThrottle(AnonRateThrottle):
    scope = "registration"


class TokenThrottle(AnonRateThrottle):
    scope = "token"


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [TokenThrottle]


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = []  # refresh uses a valid token — no anonymous throttle needed
