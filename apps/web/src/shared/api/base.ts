import axios, { type AxiosError, type AxiosResponse } from 'axios';
import { errorFx, successFx } from '~/shared/lib/message';

const successMessages: Record<string, string> = {
  post: 'Created successfully',
  put: 'Updated successfully',
  patch: 'Updated successfully',
  delete: 'Deleted successfully',
};

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: {
    path: string;
    message: string;
    code: string;
  }[];
  error?: string;
}

export const base = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Exported for direct unit testing (base.spec.ts) — avoids reaching into
// axios' internal interceptor handler list.
export const onResponseSuccess = (response: AxiosResponse): AxiosResponse => {
  const method = response.config.method?.toLowerCase();

  if (
    method &&
    successMessages[method] &&
    !response.config.url?.startsWith('/files/')
  ) {
    successFx(successMessages[method]);
  }

  return response;
};

export const onResponseError = (
  error: AxiosError<ApiErrorResponse>,
): Promise<never> => {
  const res = error.response?.data;
  let errorMsg = 'Something went wrong';

  if (res?.statusCode === 401) {
    return Promise.reject(error);
  }

  if (res?.errors?.length) {
    errorMsg = res.errors
      .map((err) => `${err.path}: ${err.message}`)
      .join('\n');
  } else if (res?.message) {
    errorMsg = res.message;
  } else if (error.message) {
    errorMsg = error.message;
  }

  errorFx(errorMsg);

  return Promise.reject(error);
};

base.interceptors.response.use(onResponseSuccess, onResponseError);
