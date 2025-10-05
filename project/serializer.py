from rest_framework import serializers
from  .models import dynamic_models

dynamic_serializers = {}

for name, model in dynamic_models.items():
    serializer = type(f'{name}Serializer', (serializers.ModelSerializer,), {
        'Meta': type('Meta', (), {'model': model, 'fields': '__all__'})
    })
    dynamic_serializers[name] = serializer