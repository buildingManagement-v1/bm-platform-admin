export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, user } = useAuth();

  // Public routes (accessible without auth)
  const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.includes(to.path);

  // If authenticated and trying to access public route → redirect to home
  if (isAuthenticated.value && isPublicRoute) {
    return navigateTo("/");
  }

  // If not authenticated and trying to access protected route → redirect to login
  if (!isAuthenticated.value && !isPublicRoute) {
    return navigateTo("/login");
  }

  // If authenticated and must reset password → redirect to change-password
  if (
    isAuthenticated.value &&
    user.value?.mustResetPassword &&
    to.path !== "/change-password"
  ) {
    return navigateTo("/change-password");
  }
});
