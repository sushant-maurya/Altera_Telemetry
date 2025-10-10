from django.urls import path
from .views import ToolsList, ProjectsList, SteppingsList, CoverageData

urlpatterns = [
    path("tools/", ToolsList.as_view(), name="tools-list"),
    path("projects/", ProjectsList.as_view(), name="projects-list"),
    path("steppings/", SteppingsList.as_view(), name="steppings-list"),
    path("coverage/", CoverageData.as_view(), name="coverage-data"),
]
