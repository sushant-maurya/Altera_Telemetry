from rest_framework.views import APIView
from rest_framework.response import Response
from .models import dynamic_models

# 🔹 Return all tools (table names)
class ToolsList(APIView):
    def get(self, request):
        tools = list(dynamic_models.keys())
        return Response(tools)


# 🔹 Return all projects for a selected tool
class ProjectsList(APIView):
    def get(self, request):
        tool = request.GET.get("tool")
        if not tool or tool not in dynamic_models:
            return Response([])
        model = dynamic_models[tool]
        projects = model.objects.values_list("project_name", flat=True).distinct()
        return Response(list(projects))


# 🔹 Return all steppings for a selected tool & project
class SteppingsList(APIView):
    def get(self, request):
        tool = request.GET.get("tool")
        project = request.GET.get("project")
        if not tool or tool not in dynamic_models or not project:
            return Response([])
        model = dynamic_models[tool]
        steppings = model.objects.filter(project_name=project).values_list(
            "stepping", flat=True
        ).distinct()
        return Response(list(steppings))


# 🔹 Return coverage data for selected tool, project, and stepping
class CoverageData(APIView):
    def get(self, request):
        tool = request.GET.get("tool")
        project = request.GET.get("project")
        stepping = request.GET.get("stepping")
        if not all([tool, project, stepping]) or tool not in dynamic_models:
            return Response({"events": [], "testcases": []})

        model = dynamic_models[tool]
        rows = model.objects.filter(project_name=project, stepping=stepping)

        # 🔹 Group by testid for testcases
        data = {}
        for row in rows:
            tc_id = row.testid
            if tc_id not in data:
                data[tc_id] = {
                    "id": tc_id,
                    "name": row.testname,
                    "status": row.test_result,
                    "Tool": row.tool_name,
                    "platform": row.platform,
                    "failedSteps": 0,
                    "overallResult": row.test_result,
                    "steps": [],
                    "platforms": [],
                }
            # Add step info
            data[tc_id]["steps"].append({
                "id": row.step_id,
                "description": row.step_description,
                "status": row.step_result.lower(),
            })

        # 🔹 Add latest result summary and platforms
        for tc in data.values():
            first_row = rows.first()
            failed_count = sum(1 for s in tc["steps"] if s["status"] == "fail")
            tc["platforms"] = [{
                "platform": tc["platform"],
                "status": tc["status"],
                "steps": tc["steps"],
                "failedSteps": failed_count,
                "overallResult": tc["overallResult"],
                "timestamp": str(first_row.time_stmp) if first_row else None
            }]
            tc["latestResult"] = tc["platforms"][0]

        # 🔹 Optional: include events if needed
        events = []
        for row in rows:
            if row.events_covered:
                for idx, name in enumerate(row.events_covered.split(",")):
                    events.append({
                        "id": f"{row.id}-event-{idx}",
                        "name": name.strip(),
                        "count": 1,
                        "threshold": 3,
                        "description": row.test_purpose or row.event_description or ""
                    })

        return Response({"events": events, "testcases": list(data.values())})
