from django.urls import path
from . import views

urlpatterns =[
    path("" ,views.OverallView.as_view() )
]