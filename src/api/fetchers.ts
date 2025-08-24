import axios, { AxiosRequestConfig } from "axios";

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];

  const response = await axiosInstance.get(url, config);

  return response.data;
};

export const postFetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];

  const response = await axiosInstance.post(url, config);

  return response.data;
};

export const patchFetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];

  const response = await axiosInstance.patch(url, config);

  return response.data;
};

export const putFetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];

  const response = await axiosInstance.put(url, config);

  return response.data;
};

export const deleteFetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];

  const response = await axiosInstance.delete(url, config);

  return response.data;
};