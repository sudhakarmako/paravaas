import { FileIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DatasourceEmptyStateProps {
  onUploadClick: () => void;
}

export function DatasourceEmptyState({
  onUploadClick,
}: DatasourceEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">No datasources yet</p>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your first CSV file to get started
        </p>
        <Button onClick={onUploadClick}>
          <UploadIcon className="h-4 w-4 mr-2" />
          Upload CSV
        </Button>
      </CardContent>
    </Card>
  );
}
