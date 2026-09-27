export const useApi = () => {
  const config = useRuntimeConfig();
  const { token, refresh, logout } = useAuth();

  const api = async <T = any>(url: string, options: any = {}) => {
    try {
      return await $fetch<T>(`${config.public.apiUrl}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: token.value ? `Bearer ${token.value}` : "",
        },
      });
    } catch (error: any) {
      if (error.statusCode === 401 && !options._isRetry) {
        try {
          await refresh();
          // Retry the request with new token
          return await api<T>(url, { ...options, _isRetry: true });
        } catch (refreshError) {
          // Refresh failed, logout user
          logout();
          throw new Error("Session expired. Please login again.");
        }
      }

      const raw = error.data?.message;
      const message = Array.isArray(raw) ? raw.join(". ") : raw || error.message || "Request failed";
      throw new Error(message);
    }
  };

  return { api };
};
