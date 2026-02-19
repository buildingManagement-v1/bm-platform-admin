import { useApiBaseUrl } from "~/composables/useApiBaseUrl";

export default defineNuxtPlugin(() => {
  const { refresh, logout, token } = useAuth();
  const apiBaseUrl = useApiBaseUrl();

  // Track if we're currently refreshing to avoid multiple refresh calls
  let isRefreshing = false;
  let refreshSubscribers: Array<(token: string) => void> = [];

  const onRefreshed = (newToken: string) => {
    refreshSubscribers.forEach((callback) => callback(newToken));
    refreshSubscribers = [];
  };

  const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
  };

  // Intercept $fetch globally
  globalThis.$fetch = new Proxy(globalThis.$fetch, {
    async apply(target, thisArg, argumentsList: any[]) {
      try {
        return await Reflect.apply(target, thisArg, argumentsList);
      } catch (error: any) {
        const originalRequest = argumentsList[0];
        const originalOptions = argumentsList[1] || {};

        // Check if it's a 401 error from our API
        if (
          error?.response?.status === 401 &&
          originalRequest?.includes(apiBaseUrl) &&
          !originalRequest?.includes("/auth/login") &&
          !originalRequest?.includes("/auth/refresh")
        ) {
          if (!isRefreshing) {
            isRefreshing = true;
            try {
              const newToken = await refresh();
              isRefreshing = false;
              onRefreshed(newToken);

              // Retry original request with new token
              const retryOptions = {
                ...originalOptions,
                headers: {
                  ...originalOptions.headers,
                  Authorization: `Bearer ${newToken}`,
                },
              };
              return await target(originalRequest, retryOptions);
            } catch (refreshError) {
              isRefreshing = false;
              refreshSubscribers = [];
              throw refreshError;
            }
          } else {
            // Wait for token refresh to complete
            return new Promise((resolve, reject) => {
              addRefreshSubscriber((newToken: string) => {
                const retryOptions = {
                  ...originalOptions,
                  headers: {
                    ...originalOptions.headers,
                    Authorization: `Bearer ${newToken}`,
                  },
                };
                target(originalRequest, retryOptions)
                  .then(resolve)
                  .catch(reject);
              });
            });
          }
        }

        throw error;
      }
    },
  });
});
