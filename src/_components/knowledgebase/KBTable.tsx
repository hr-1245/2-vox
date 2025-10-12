"use client";
import { useEffect, useState, useMemo } from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KnowledgeBaseRow } from "@/types/kb";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Button } from "@/components/ui/button";

const LIMIT = 10;

interface KBTableProps {
  refreshKey?: number | string; // bump to re-fetch
  selectable?: boolean;
  showActions?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  onRemove?: (id: string) => void; // optional external handler
}

export function KBTable({
  refreshKey = 0,
  selectable = false,
  showActions = true,
  onSelectionChange,
  onRemove,
}: KBTableProps) {
  const [rows, setRows] = useState<KnowledgeBaseRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---- fetch ----
  useEffect(() => {
    setLoading(true);
    fetch("/api/ai/knowledgebase")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRows(json.data ?? []);
        else toast.error("Failed to load KBs");
      })
      .catch(() => toast.error("Network error"))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // ---- search + pagination ----
  const filtered = useMemo(
    () =>
      rows.filter((kb) => kb.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );
  const totalPages = Math.ceil(filtered.length / LIMIT);
  const startIdx = (page - 1) * LIMIT;
  const pageData = filtered.slice(startIdx, startIdx + LIMIT);

  // ---- selection ----
  useEffect(
    () => onSelectionChange?.(Array.from(selected)),
    [selected, onSelectionChange]
  );

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === pageData.length
        ? new Set()
        : new Set(pageData.map((r) => r.id))
    );
  };

  // ---- delete ----
  const handleDelete = async (id: string) => {
    if (!showActions) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ai/knowledgebase/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      // re-fetch entire list → real-time removal
      const fresh = await fetch("/api/ai/knowledgebase").then((r) => r.json());
      if (fresh.success) setRows(fresh.data ?? []);
      else throw new Error("Refresh failed");

      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setOpenId(null);
    } catch (e: any) {
      toast.error(e.message || "Delete error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {/* Search Bar */}
      <div className="flex items-center justify-between mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="flex-1 max-w-xs bg-[#1E1E1E] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#ef3d6d]"
        />
        <span className="text-xs text-gray-400 ml-4">
          {filtered.length} KBs
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#171717] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-gray-300">
          <thead className="bg-[#1E1E1E] text-gray-200">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === pageData.length && pageData.length !== 0
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 accent-[#ef3d6d]"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-center">FAQs</th>
              <th className="px-4 py-3 text-center">Files</th>
              <th className="px-4 py-3 text-center">Websites</th>
              <th className="px-4 py-3 text-left">Created</th>
              {showActions && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageData.map((kb) => (
              <tr
                key={kb.id}
                className="border-t border-gray-800 hover:bg-[#1E1E1E]"
              >
                {selectable && (
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(kb.id)}
                      onChange={() => toggleOne(kb.id)}
                      className="w-4 h-4 accent-[#ef3d6d]"
                    />
                  </td>
                )}
                <td className="px-4 py-3 font-medium text-white">{kb.name}</td>
                <td className="px-4 py-3 text-center">{kb.faq_count}</td>
                <td className="px-4 py-3 text-center">{kb.file_count}</td>
                <td className="px-4 py-3 text-center">{kb.web_count}</td>
                <td className="px-4 py-3">
                  {new Date(kb.created_at).toLocaleDateString()}
                </td>
                {showActions && (
                  <td className="px-4 py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-gray-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#1E1E1E] border-gray-700"
                      >
                        <DropdownMenuItem
                          onClick={() => console.log("edit", kb.id)}
                          className="text-gray-200 focus:bg-[#ef3e6d] focus:text-white"
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setOpenId(kb.id)}
                          className="text-gray-200 focus:bg-red-600 focus:text-white"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - always visible */}
      <div className="flex items-center justify-between text-sm text-gray-300 mt-4">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-[#262626] border border-gray-700 text-gray-200 hover:bg-[#ef3d6d] disabled:opacity-50"
        >
          Prev
        </Button>

        <Button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="bg-[#262626] border border-gray-700 text-gray-200 hover:bg-[#ef3d6d] disabled:opacity-50"
        >
          Next
        </Button>
      </div>

      {/* Confirmation Modal (actions only) */}
      {showActions && (
        <ConfirmDialog
          open={!!openId}
          onOpenChange={(open) => setOpenId(open ? openId : null)}
          title="Delete Knowledge Base"
          description="This will permanently remove the knowledge base and all its content. Are you sure?"
          onConfirm={() => openId && handleDelete(openId)}
          deleting={deleting}
        />
      )}
    </>
  );
}
