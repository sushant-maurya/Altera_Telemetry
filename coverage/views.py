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
            # Try to detect the correct field names
            model_fields = [f.name for f in model._meta.fields]
            eid_field = "eventid" if "eventid" in model_fields else "event_id"
            ip_field = "ip" if "ip" in model_fields else None

            if not ip_field:
                print(f"Model {model_name} has no 'ip' field, skipping")
                continue

            # Iterate all rows
            for obj in model.objects.values(eid_field, ip_field):
                eid = obj.get(eid_field)
                ip = obj.get(ip_field)
                if eid and ip:
                    key = (eid, ip)
                    event_counts[key] = event_counts.get(key, 0) + 1

        # Print the counts for verification
        for (eid, ip), count in event_counts.items():
            print(f"Event: {eid}, IP: {ip}, Count: {count}")

        # Attach count to each coverage record
        enriched_data = []
        for row in data:
            key = (row['event_id'], row['ip'])  # use both event_id and ip
            row['event_count'] = event_counts.get(key, 0)
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
        

class UniqueIPView(APIView):
    def get(self, request):
        ip = list(CoverageMapping.objects.values_list("ip", flat=True).distinct())
        return Response({"ip": ip})
    
class CoverageIndicatorView(APIView):
    def get(self, request):
        selected_ip = request.query_params.get("ip")
        if not selected_ip:
            return Response({"error": "Missing IP parameter"}, status=400)

        # Step 1: Compute dynamic hit counts from all dynamic models
        event_counts = {}
        for model_name, model in dynamic_models.items():
            # Only consider rows matching the selected IP if model has IP field
            qs = model.objects.all()
            if hasattr(model, "ip"):
                qs = qs.filter(ip=selected_ip)
            for eid in qs.values_list("eventid", flat=True):
                if eid:
                    event_counts[eid] = event_counts.get(eid, 0) + 1

        # Step 2: Fetch CoverageMapping for selected IP
        mappings = CoverageMapping.objects.filter(ip=selected_ip)
        data = []

        for mapping in mappings:
            coverage_id = mapping.coverage_id
            # Assume mapping.coverage_mapping is comma-separated event_ids
            events_list = [e.strip() for e in mapping.coverage_mapping.split(",") if e.strip()]
            event_data = []

            for event_id in events_list:
                # Fetch Coverage row for event_id and selected_ip
                coverage_event = Coverage.objects.filter(event_id=event_id, ip=selected_ip).first()
                threshold = coverage_event.threshold if coverage_event else 0
                hit = event_counts.get(event_id, 0)  # dynamic calculation
                event_data.append({
                    "event_id": event_id,
                    "hit": hit,
                    "threshold": threshold
                })

            data.append({
                "coverage_id": coverage_id,
                "events": event_data
            })

        return Response(data)
    


class EventCoverageView(APIView):
    """
    Returns pie chart data per event_id
    """
    def get(self, request):
        try:
            all_events = Coverage.objects.values_list("event_id", flat=True).distinct()
            response_data = []

            # Compute hit counts from dynamic models
            event_counts = {}
            for model_name, model in dynamic_models.items():
                model_fields = [f.name for f in model._meta.fields]
                eid_field = "eventid" if "eventid" in model_fields else "event_id"
                ip_field = "ip" if "ip" in model_fields else None

                if not ip_field:
                    continue

                for obj in model.objects.values(eid_field, ip_field):
                    eid = obj.get(eid_field)
                    ip = obj.get(ip_field)
                    if eid and ip:
                        key = (eid, ip)
                        event_counts[key] = event_counts.get(key, 0) + 1

            # Build response per event_id
            for event_id in all_events:
                coverages = Coverage.objects.filter(event_id=event_id)
                if not coverages.exists():
                    continue

                ips_data = []
                total_hit = 0
                total_threshold = 0

                for cov in coverages:
                    ip = cov.ip
                    threshold = getattr(cov, "threshold", 1)
                    hit = event_counts.get((event_id, ip), 0)  # use dynamic model counts

                    total_hit += hit
                    total_threshold += threshold

                    ips_data.append({
                        "ip": ip,
                        "hit": hit,
                        "threshold": threshold
                    })

                response_data.append({
                    "event_id": event_id,
                    "total_hit": total_hit,
                    "total_threshold": total_threshold,
                    "ips": ips_data
                })

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




