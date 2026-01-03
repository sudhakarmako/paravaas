import { FileSpreadsheetIcon, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize, formatDate } from "@/core/lib/format";
import type { Datasource } from "@/core/types/datasources";

interface DatasourceCardProps {
  datasource: Datasource;
}

export function DatasourceCard({ datasource }: DatasourceCardProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors shrink-0">
            <FileSpreadsheetIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold truncate leading-tight">
              {datasource.fileName}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">
                {formatFileSize(datasource.fileSize)}
              </span>
              <span>•</span>
              <span className="truncate">{datasource.mimeType}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[10px] opacity-75 truncate">
            {formatDate(datasource.uploadedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
