import type { Admin, LoginResponse, ApiResponse } from "~/types";

export const useAuth = () => {
  const config = useRuntimeConfig();
  const router = useRouter();

  // Store user and tokens in cookies for persistence
  const userCookie = useCookie<Admin | null>("admin_user", {
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  const user = useState<Admin | null>("user", () => userCookie.value);
  const token = useCookie("admin_token", {
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  const refreshToken = useCookie("admin_refresh_token", {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  const login = async (email: string, password: string) => {
    const response = await $fetch<ApiResponse<LoginResponse>>(
      `${config.public.apiUrl}/v1/platform/auth/login`,
      {
        method: "POST",
        body: { email, password },
      }
    );

    token.value = response.data.accessToken;
    refreshToken.value = response.data.refreshToken;
    user.value = response.data.admin;
    userCookie.value = response.data.admin;

    return response;
  };

  const logout = () => {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    userCookie.value = null;
    router.push("/login");
  };

  const refresh = async () => {
    if (!refreshToken.value) {
      throw new Error("No refresh token available");
    }

    const response = await $fetch<ApiResponse<{ accessToken: string }>>(
      `${config.public.apiUrl}/v1/platform/auth/refresh`,
      {
        method: "POST",
        body: { refreshToken: refreshToken.value },
      }
    );

    token.value = response.data.accessToken;
    return response.data.accessToken;
  };

  const isAuthenticated = computed(() => !!token.value);

  return {
    user,
    token,
    refreshToken,
    login,
    logout,
    refresh,
    isAuthenticated,
  };
};
