from django.shortcuts import render
from rest_framework import viewsets
from  rest_framework.permissions import AllowAny
from .serializer import CoverageSerializer
from .models import Coverage

# Create your views here.

class CoverageViewSet(viewsets.ModelViewSet):
    queryset = Coverage.objects.all()
    serializer_class = CoverageSerializer
    permission_classes = [AllowAny]
