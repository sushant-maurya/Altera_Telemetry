from django.urls import path ,include
from rest_framework.routers import DefaultRouter
from .views import CoverageViewSet , CoverageMappingList, CoverageMappingBulkUpload ,CoverageIndicatorView,UniqueIPView ,EventCoverageView
from .downloadupload import CoverageTemplateDownload ,CoverageBulkUpload 


router = DefaultRouter()
router.register(r'', CoverageViewSet) # by default first time this will come 



urlpatterns = [
    path("template/", CoverageTemplateDownload.as_view(), name="coverage-template"),
    path("bulk-upload/", CoverageBulkUpload.as_view(), name="coverage-bulk-upload"),
    path('coverage-mapping/', CoverageMappingList.as_view(), name='coverage-mapping-list'),
    path('coverage-mapping/bulk-upload/', CoverageMappingBulkUpload.as_view(), name='coverage-mapping-bulk-upload'),
    path("unique-ip/", UniqueIPView.as_view(), name="unique-ip"),
    path("indicator/", CoverageIndicatorView.as_view(), name="coverage-indicator"),
    path("coverage-event/", EventCoverageView.as_view(), name="event-coverage"),
    path('' ,include(router.urls)),
    
]