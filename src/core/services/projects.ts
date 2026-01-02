import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";

const QUERY_KEY = "projects";
const API_URL = "/projects";

export const getProjects = queryOptions({
  queryKey: [QUERY_KEY],
  queryFn: () => api.get(API_URL),
});
