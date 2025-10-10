from django.db import models

# Create your models here.
class Coverage(models.Model):
    event_id = models.CharField(max_length=100)
    event_name = models.CharField(max_length=500)
    event_type = models.CharField(max_length=100)
    ip = models.CharField(max_length=500)
    threshold = models.IntegerField(default = 0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['event_id' ,'ip'], name = "combined_primary_key")
        ]