from rest_framework import serializers
from .models import Coverage

class CoverageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coverage
        fields = '__all__'

        