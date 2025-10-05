from django.urls import path
from .views import dynamic_views

urlpatterns = []

for name, view in dynamic_views.items():
    url_name = name.lower()
    urlpatterns.append(path(f'{url_name}/', view.as_view(), name=f'{url_name}-list'))
