import { DatasourceCard } from "./datasource-card";
import type { Datasource } from "@/core/types/datasources";

interface DatasourceListProps {
  datasources: Datasource[];
  projectId: string;
}

export function DatasourceList({ datasources, projectId }: DatasourceListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {datasources.map((datasource) => (
        <DatasourceCard
          key={datasource.id}
          datasource={datasource}
          projectId={projectId}
        />
      ))}
    </div>
  );
}
