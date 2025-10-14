from rest_framework import serializers
from .models import Coverage, CoverageMapping

class CoverageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coverage
        fields = '__all__'

class CoverageMappingSerializer(serializers.ModelSerializer):
    matched_events = serializers.SerializerMethodField()

    class Meta:
        model = CoverageMapping
        fields = ["coverage_id", "coverage_mapping", "ip", "matched_events"]

    def get_matched_events(self, obj):
       
        events = [e.strip() for e in obj.coverage_mapping.split(",") if e.strip()]

        matched = []
        for event in events:
            exists = Coverage.objects.filter(event_id=event).exists()
            matched.append({
                "event": event,
                "is_matched": exists
            })
        return matched
