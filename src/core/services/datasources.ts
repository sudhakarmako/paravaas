import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";
import type { DatasourcesResponse } from "@/core/types/datasources";

const QUERY_KEY = "datasources";
const API_URL = "/projects";

export const getDatasources = (projectId: string | number) =>
  queryOptions({
    queryKey: [QUERY_KEY, projectId],
    queryFn: () =>
      api.get(
        `${API_URL}/${projectId}/datasources`
      ) as Promise<DatasourcesResponse>,
  });
