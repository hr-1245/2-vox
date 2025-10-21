"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Trash2, FileText } from "lucide-react";

export default function UrlTable({ urls = [] }: any) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox />
            </TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Created at</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {urls?.length > 0 ? (
            urls.map((item: any) => (
              <TableRow key={item?.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <a
                    href={item?.data?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:cursor-pointer"
                  >
                    {item?.data?.url}
                  </a>
                </TableCell>
                <TableCell>{item?.created_at?.split("T")?.[0]}</TableCell>
                <TableCell className="text-right flex justify-end gap-3 pr-2">
                  <button title="Delete">
                    <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-6 text-sm text-gray-500"
              >
                No URLs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
