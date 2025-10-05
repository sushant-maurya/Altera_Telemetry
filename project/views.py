from django.shortcuts import render
from .models import dynamic_models
from .serializer import dynamic_serializers
# Create your views here.
from rest_framework import generics

dynamic_views = {}

for name, model in dynamic_models.items():
    serializer = dynamic_serializers[name]
    view = type(f'{name}ListCreate', (generics.ListAPIView,), {
        'get_queryset': lambda self, model=model: model.objects.all(),
        'serializer_class': serializer
    })
    dynamic_views[name] = view
