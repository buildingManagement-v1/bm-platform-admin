export const useApi = () => {
  const config = useRuntimeConfig();
  const { token } = useAuth();

  const api = <T = any>(url: string, options: any = {}) => {
    return $fetch<T>(`${config.public.apiUrl}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: token.value ? `Bearer ${token.value}` : "",
      },
    });
  };

  return { api };
};
