import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";
import type {
  DatasourcesResponse,
  DatasourceDataResponse,
} from "@/core/types/datasources";
import { DATASOURCE_CONSTANTS } from "@/core/constants";

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

export const getDatasource = (
  projectId: string | number,
  datasourceId: string | number
) =>
  queryOptions({
    queryKey: [QUERY_KEY, projectId, datasourceId],
    queryFn: () =>
      api.get(
        `${API_URL}/${projectId}/datasources/${datasourceId}`
      ) as Promise<{
        datasource: import("@/core/types/datasources").Datasource;
      }>,
    staleTime: DATASOURCE_CONSTANTS.METADATA_STALE_TIME,
    gcTime: DATASOURCE_CONSTANTS.METADATA_GC_TIME,
  });

export const getDatasourceData = (
  projectId: string | number,
  datasourceId: string | number,
  limit: number = DATASOURCE_CONSTANTS.DEFAULT_LIMIT,
  offset: number = 0
) =>
  queryOptions({
    queryKey: ["datasource-data", projectId, datasourceId, limit, offset],
    queryFn: () =>
      api.get(
        `${API_URL}/${projectId}/datasources/${datasourceId}/data?limit=${limit}&offset=${offset}`
      ) as Promise<DatasourceDataResponse>,
    staleTime: DATASOURCE_CONSTANTS.DATA_STALE_TIME,
    gcTime: DATASOURCE_CONSTANTS.DATA_GC_TIME,
  });
