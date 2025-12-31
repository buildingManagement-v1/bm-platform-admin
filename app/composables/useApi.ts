export const useApi = () => {
  const config = useRuntimeConfig();
  const { token } = useAuth();

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
      const message = error.data?.message || error.message || "Request failed";
      throw new Error(message);
    }
  };

  return { api };
};
