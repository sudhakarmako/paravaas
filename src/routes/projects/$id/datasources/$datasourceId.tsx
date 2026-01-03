import { createFileRoute } from "@tanstack/react-router";
import { getDatasource, getDatasourceData } from "@/core/services/datasources";
import { DATASOURCE_CONSTANTS } from "@/core/constants";
import { ExcelView } from "@/components/datasource/excel-view";

export const Route = createFileRoute("/projects/$id/datasources/$datasourceId")(
  {
    component: DatasourceViewPage,
    loader: async ({ context, params }) => {
      const queryClient = (context as { queryClient?: any }).queryClient;
      if (queryClient) {
        const datasource = await queryClient.ensureQueryData(
          getDatasource(params.id, params.datasourceId)
        );
        // Pre-fetch initial table data if datasource is ready
        if (
          datasource?.datasource?.status === "completed" &&
          datasource?.datasource?.duckdbTableName
        ) {
          queryClient
            .prefetchQuery(
              getDatasourceData(
                params.id,
                params.datasourceId,
                DATASOURCE_CONSTANTS.BATCH_SIZE,
                0
              )
            )
            .catch(() => {
              // Ignore prefetch errors
            });
        }
        return datasource;
      }
    },
  }
);

function DatasourceViewPage() {
  const { id } = Route.useParams();
  const loaderData = Route.useLoaderData();

  if (!loaderData?.datasource) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Datasource not found</p>
      </div>
    );
  }

  return <ExcelView datasource={loaderData.datasource} projectId={id} />;
}
