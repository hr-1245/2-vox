"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileIcon, Trash2, Eye } from "lucide-react";

interface FileTableProps {
  files: any[];
}

export default function FileTable({ files }: FileTableProps) {
  if (!files?.length) {
    return (
      <div className="border rounded-lg mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Uploaded At</TableHead>
              <TableHead>Size (KB)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <FileIcon className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No Data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Uploaded At</TableHead>
            <TableHead>Size (KB)</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files?.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium">
                {file?.data?.fileName}
              </TableCell>
              <TableCell>
                {new Date(file.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {((file?.data?.size || 0) / 1024).toFixed(1)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
