from django.shortcuts import render
from django.views import View

from django.http import HttpResponse

# Create your views here.
class OverallView(View):
    def get(self,request):
        return render(request, "core/overall.html")
    



