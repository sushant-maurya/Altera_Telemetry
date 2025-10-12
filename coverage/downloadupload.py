import csv
import chardet  # 👈 add this import
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from .models import Coverage


class CoverageTemplateDownload(APIView):
    def get(self, request):
        headers = ["event_id", "event_name", "event_type", "ip", "threshold"]

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="coverage_template.csv"'

        writer = csv.writer(response)
        writer.writerow(headers)
        return response


class CoverageBulkUpload(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Read file bytes
            raw_data = file.read()

            # Detect encoding automatically
            detected = chardet.detect(raw_data)
            encoding = detected.get("encoding", "utf-8")

            # Decode with detected encoding
            decoded_file = raw_data.decode(encoding, errors="replace").splitlines()

            reader = csv.DictReader(decoded_file)
            created = []
            skipped = []

            for row in reader:
                if not row.get("event_id") or not row.get("ip"):
                    skipped.append(row)
                    continue

                obj, created_flag = Coverage.objects.get_or_create(
                    event_id=row["event_id"].strip(),
                    ip=row["ip"].strip(),
                    defaults={
                        "event_name": row.get("event_name", "").strip(),
                        "event_type": row.get("event_type", "").strip(),
                        "threshold": int(row.get("threshold", 0)),
                    },
                )
                if created_flag:
                    created.append(obj.id)

            return Response(
                {
                    "inserted_ids": created,
                    "skipped_rows": len(skipped),
                    "encoding_used": encoding,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
