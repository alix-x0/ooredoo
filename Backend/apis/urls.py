from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, MyTokenObtainPairView, UserProfileView,
    UserListView, UserAdminUpdateView, ChangePasswordView,
    GiftListCreateView, GiftRetrieveUpdateDestroyView,
    GiftAssignmentListCreateView, GiftAssignmentDestroyView,
    DispatchOrderListCreateView, DispatchOrderActionView
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserAdminUpdateView.as_view(), name='user-admin-update'),
    path('gifts/', GiftListCreateView.as_view(), name='gift-list'),
    path('gifts/<int:pk>/', GiftRetrieveUpdateDestroyView.as_view(), name='gift-detail'),
    path('gift-assignments/', GiftAssignmentListCreateView.as_view(), name='gift-assignment-list'),
    path('gift-assignments/<int:pk>/', GiftAssignmentDestroyView.as_view(), name='gift-assignment-detail'),
    path('dispatches/', DispatchOrderListCreateView.as_view(), name='dispatch-list'),
    path('dispatches/<int:pk>/action/', DispatchOrderActionView.as_view(), name='dispatch-action'),
]


