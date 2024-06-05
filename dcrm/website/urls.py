
from django.contrib import admin
from django.urls import path, include
from . import views 
from .views import home, login_user, logout_user, register_user, customer_record, delete_record

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', login_user, name='login'),
    path('logout/', logout_user, name='logout'),
    path('register/', views.register_user, name='register'),
    path('registro/<int:pk>', views.customer_record, name='record'),
    path('borrar/<int:pk>', views.delete_record, name='delete_record'),
    path('agregar/', views.add_record, name='add_record'),
    path('modificar/<int:pk>', views.update_record, name='update_record'),
]
