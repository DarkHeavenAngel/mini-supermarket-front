from django.shortcuts import render

def home_page(request):
    return render(request, "main.html")

def employees_page(request):
    return render(request, "employees.html")

