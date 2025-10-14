from django.shortcuts import render
from rest_framework import viewsets ,status
from rest_framework.decorators import action
from  rest_framework.permissions import AllowAny
from .serializer import CoverageSerializer,CoverageMappingSerializer
from .models import Coverage , CoverageMapping
from rest_framework.response import Response
import pandas as pd
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser

from project.models import dynamic_models

# Create your views here.

class CoverageViewSet(viewsets.ModelViewSet):
    queryset = Coverage.objects.all()
    serializer_class = CoverageSerializer
    

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        # Compute counts for each event_id from all dynamic tool tables
        event_counts = {}
        for model_name, model in dynamic_models.items():
            for eid in model.objects.values_list('eventid', flat=True):
                if eid:
                    event_counts[eid] = event_counts.get(eid, 0) + 1

        # Attach count to each coverage record
        enriched_data = []
        for row in data:
            row['event_count'] = event_counts.get(row['event_id'], 0)
            enriched_data.append(row)

        return Response(enriched_data)
    
    
class CoverageMappingList(APIView):
    def get(self, request):
        ip = request.query_params.get("ip")
        if ip:
            mappings = CoverageMapping.objects.filter(ip=ip)
        else:
            mappings = CoverageMapping.objects.all()
        serializer = CoverageMappingSerializer(mappings, many=True)
        return Response(serializer.data)

class CoverageMappingBulkUpload(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        sheet_name = request.data.get("sheet_name")
        ip = request.data.get("ip")

        if not file or not sheet_name or not ip:
            return Response({"error": "File, sheet_name, and IP are required."}, status=400)

        

        try:
            df = pd.read_excel(file, sheet_name=sheet_name)
            required_cols = ["VPD_ID", "Coverage Event Mapping"]

            # Make columns case-insensitive and ignore spaces
            df.columns = [col.strip() for col in df.columns]

            if not all(col in df.columns for col in required_cols):
                return Response(
                    {"error": f"Excel must contain columns: {required_cols}. Found: {list(df.columns)}"},
                    status=400
                )

            created = []
            updated = []

            for _, row in df.iterrows():
                obj, created_flag = CoverageMapping.objects.update_or_create(
                    coverage_id=row["VPD_ID"],
                    ip=ip,  # automatically assign the selected IP
                    defaults={"coverage_mapping": row["Coverage Event Mapping"]}
                )
                if created_flag:
                    created.append(obj.id)
                else:
                    updated.append(obj.id)

            return Response(
                {"created_ids": created, "updated_ids": updated, "total_rows": len(df)},
                status=201
            )
        except Exception as e:
            import traceback
            print("⚠️ Excel upload failed:", traceback.format_exc())
            return Response({"error": str(e)}, status=400)






