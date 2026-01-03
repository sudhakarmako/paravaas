import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";
import type { CreateProjectInput, Project } from "@/core/types/projects";

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
