from django.urls import path ,include
from rest_framework.routers import DefaultRouter
from .views import CoverageViewSet
from .downloadupload import CoverageTemplateDownload ,CoverageBulkUpload


router = DefaultRouter()
router.register(r'', CoverageViewSet)


urlpatterns = [
    path("template/", CoverageTemplateDownload.as_view(), name="coverage-template"),
    path("bulk-upload/", CoverageBulkUpload.as_view(), name="coverage-bulk-upload"),
    path('' ,include(router.urls)),
    
]