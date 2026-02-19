import type { User, UserType, LoginResponse, ApiResponse } from "~/types";
import { useApiBaseUrl } from "./useApiBaseUrl";

export const useAuth = () => {
  const apiBaseUrl = useApiBaseUrl();
  const router = useRouter();

  const userCookie = useCookie<User | null>("user", {
    maxAge: 60 * 60 * 24 * 7,
  });

  const user = useState<User | null>("user", () => userCookie.value);
  const token = useCookie("token", {
    maxAge: 60 * 60 * 24 * 7,
  });

  const refreshToken = useCookie("refresh_token", {
    maxAge: 60 * 60 * 24 * 30,
  });

  const userType = useCookie<UserType | null>("user_type", {
    maxAge: 60 * 60 * 24 * 7,
  });

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch<ApiResponse<LoginResponse>>(
        `${apiBaseUrl}/v1/platform/auth/login`,
        {
          method: "POST",
          body: { email, password },
        },
      );

      token.value = response.data.accessToken;
      refreshToken.value = response.data.refreshToken;

      const userData = response.data.admin;
      user.value = userData!;
      userCookie.value = userData!;
      userType.value = "admin";

      return response;
    } catch (error: any) {
      const message = error.data?.message || error.message || "Login failed";
      throw new Error(message);
    }
  };

  const logout = () => {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    userCookie.value = null;
    userType.value = null;
    router.push("/login");
  };

  const refresh = async () => {
    if (!refreshToken.value) {
      throw new Error("No refresh token available");
    }

    const response = await $fetch<ApiResponse<{ accessToken: string }>>(
      `${apiBaseUrl}/v1/platform/auth/refresh`,
      {
        method: "POST",
        body: { refreshToken: refreshToken.value },
      },
    );

    token.value = response.data.accessToken;
    return response.data.accessToken;
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await $fetch(`${apiBaseUrl}/v1/platform/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: { currentPassword: oldPassword, newPassword },
      });

      if (user.value) {
        user.value.mustResetPassword = false;
        userCookie.value = user.value;
      }
    } catch (error: any) {
      const message =
        error.data?.message || error.message || "Password change failed";
      throw new Error(message);
    }
  };

  const isAuthenticated = computed(() => !!token.value);

  return {
    user,
    userType,
    token,
    refreshToken,
    login,
    logout,
    refresh,
    changePassword,
    isAuthenticated,
  };
};
