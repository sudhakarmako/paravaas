import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  Project,
} from "@/core/types/projects";

const QUERY_KEY = "projects";
const API_URL = "/projects";

export const getProjects = queryOptions({
  queryKey: [QUERY_KEY],
  queryFn: () => api.get(API_URL) as Promise<{ projects: Project[] }>,
});

export const createProject = {
  mutationFn: (data: CreateProjectInput) =>
    api.post(API_URL, data) as Promise<{ project: Project }>,
};

export const toggleProjectPin = {
  mutationFn: ({ id, isPinned }: { id: number; isPinned: boolean }) =>
    api.patch(`${API_URL}/${id}`, { isPinned }) as Promise<{
      project: Project;
    }>,
};

export const getProject = (id: string | number) =>
  queryOptions({
    queryKey: [QUERY_KEY, id],
    queryFn: () => api.get(`${API_URL}/${id}`) as Promise<{ project: Project }>,
  });

export const updateProject = {
  mutationFn: ({
    id,
    data,
  }: {
    id: string | number;
    data: UpdateProjectInput;
  }) =>
    api.put(`${API_URL}/${id}`, data) as Promise<{
      project: Project;
    }>,
};

export const deleteProject = {
  mutationFn: (id: string | number) =>
    api.delete(`${API_URL}/${id}`, undefined) as Promise<{
      message: string;
      project: Project;
    }>,
};
