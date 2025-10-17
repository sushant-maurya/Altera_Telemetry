from django.db import models
from django.apps import apps

class ToolBase(models.Model):
    id = models.AutoField(primary_key=True)
    idsid = models.CharField(max_length=50)
    trace_id = models.CharField(max_length=500)
    span_id = models.CharField(max_length=500)
    instance_id = models.CharField(max_length=500)
    run_id = models.CharField(max_length=500,null=True, blank=True)
    stat_us = models.CharField(max_length=50)

    body = models.TextField()
    platform = models.CharField(max_length=500,null=True, blank=True)
    download_url = models.TextField()
    function_name = models.CharField(max_length=100)
    time_stmp = models.CharField(max_length=100)

    versions = models.TextField()  # version info
    project_name = models.CharField(max_length=100)
    stepping = models.CharField(max_length=100)
    tool_name = models.CharField(max_length=100)

    testid = models.CharField(max_length=100)
    testname = models.CharField(max_length=500)
    mapping = models.CharField(max_length=500)
    events_covered = models.CharField(max_length=500)

    test_purpose = models.TextField()
    test_config_cmd = models.TextField()
    test_result = models.CharField(max_length=100)

    eventid = models.CharField(max_length=100)
    event_description = models.TextField()

    step_id = models.CharField(max_length=100)
    step_description = models.TextField()
    step_result = models.CharField(max_length=100)

    ip = models.CharField(max_length=200)

    class Meta:
        abstract = True


# Tools list
available_tool = ['nanoscope']

dynamic_models = {}

for table_name in available_tool:
    attrs = {
        '__module__': __name__,
        'Meta': type('Meta', (), {
            'db_table': table_name,
            'managed': False
        })
    }
    model = type(table_name, (ToolBase,), attrs)
    dynamic_models[table_name] = model

    # # Register the model in the app registry
    # apps.register_model('project', model)
