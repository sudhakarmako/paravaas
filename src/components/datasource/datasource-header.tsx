import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatasourceHeaderProps {
  onUploadClick: () => void;
}

export function DatasourceHeader({ onUploadClick }: DatasourceHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Datasources</h2>
        <p className="text-muted-foreground">
          Manage CSV files for this project
        </p>
      </div>
      <Button onClick={onUploadClick}>
        <UploadIcon className="h-4 w-4 mr-2" />
        Upload CSV
      </Button>
    </div>
  );
}
