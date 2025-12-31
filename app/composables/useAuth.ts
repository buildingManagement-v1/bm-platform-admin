export const useAuth = () => {
  const config = useRuntimeConfig();
  const router = useRouter();

  const user = useState<any>("user", () => null);
  const token = useCookie("admin_token", {
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  const login = async (email: string, password: string) => {
    const { data, error } = await useFetch(
      `${config.public.apiUrl}/v1/platform/auth/login`,
      {
        method: "POST",
        body: { email, password },
      }
    );

    if (error.value) {
      throw new Error(error.value.data?.message || "Login failed");
    }

    const result = data.value as any;
    token.value = result.data.accessToken;
    user.value = result.data.admin;

    return result;
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    router.push("/login");
  };

  const isAuthenticated = computed(() => !!token.value);

  return {
    user,
    token,
    login,
    logout,
    isAuthenticated,
  };
};
