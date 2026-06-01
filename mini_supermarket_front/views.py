from django.shortcuts import render

def home_page(request):
    return render(request, "main.html")

def employees_page(request):
    return render(request, "employees.html")

def login_page(request):
    return render(request, "login.html")

def profile_page(request):
    return render(request, 'profile.html')

def categories_page(request):
    return render(request, 'categories.html')

def products_page(request):
    return render(request, 'products.html')

def store_products_page(request):
    return render(request, 'store_products.html')

def customers_page(request):
    return render(request, 'customers.html')

def checks_page(request):
    return render(request, 'checks.html')

def reports_page(request):
    return render(request, 'reports.html')

