from django.urls import path ,include
from rest_framework.routers import DefaultRouter
from .views import CoverageViewSet


router = DefaultRouter()
router.register(r'', CoverageViewSet)


urlpatterns = [
    path('' ,include(router.urls))
]