from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (SpectacularAPIView, SpectacularRedocView,
                                   SpectacularSwaggerView)
from user.views import ThrottledTokenObtainPairView, ThrottledTokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/schema/",   SpectacularAPIView.as_view(),                         name="schema"),
    path("api/v1/swagger/",  SpectacularSwaggerView.as_view(url_name="schema"),    name="swagger-ui"),
    path("api/v1/redoc/",    SpectacularRedocView.as_view(url_name="schema"),       name="redoc"),
    path("api/v1/token/",         ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/token/refresh/", ThrottledTokenRefreshView.as_view(),   name="token_refresh"),
    path("api/v1/", include("team.urls")),
    path("api/v1/", include("user.urls")),
    path("api/v1/", include("pwb.urls")),
]
