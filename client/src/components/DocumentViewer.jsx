import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useApi } from '../hooks/useApi';
import JsonCell from './JsonCell';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  FileJson2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function DocumentViewer({ connectionId, dbName, collectionName }) {
  const { get } = useApi();
  const [documents, setDocuments] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = async (p = page, ps = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const data = await get(
        `/documents/${connectionId}/${dbName}/${collectionName}?page=${p}&pageSize=${ps}`
      );
      setDocuments(data.documents);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when collection changes
  useEffect(() => {
    setPage(1);
    fetchDocuments(1, pageSize);
  }, [connectionId, dbName, collectionName]);

  // Build columns dynamically from document keys
  const columns = useMemo(() => {
    if (documents.length === 0) return [];

    // Collect all unique keys across documents
    const keySet = new Set();
    documents.forEach((doc) => {
      Object.keys(doc).forEach((key) => keySet.add(key));
    });

    // Put _id first, then sort alphabetically
    const keys = Array.from(keySet);
    keys.sort((a, b) => {
      if (a === '_id') return -1;
      if (b === '_id') return 1;
      return a.localeCompare(b);
    });

    return keys.map((key) => ({
      accessorKey: key,
      header: key,
      size: key === '_id' ? 220 : 180,
      cell: ({ getValue }) => {
        const value = getValue();
        if (value === null || value === undefined) {
          return <span className="text-text-muted italic text-xs">null</span>;
        }
        if (typeof value === 'object') {
          return <JsonCell value={value} />;
        }
        if (typeof value === 'boolean') {
          return (
            <span
              className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${
                value
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error'
              }`}
            >
              {String(value)}
            </span>
          );
        }
        if (typeof value === 'number') {
          return (
            <span className="font-mono text-xs text-blue-400">
              {value.toLocaleString()}
            </span>
          );
        }
        // String — truncate if too long
        const strValue = String(value);
        if (strValue.length > 100) {
          return (
            <span className="text-xs" title={strValue}>
              {strValue.slice(0, 100)}…
            </span>
          );
        }
        return <span className="text-xs">{strValue}</span>;
      },
    }));
  }, [documents]);

  const table = useReactTable({
    data: documents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchDocuments(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
    fetchDocuments(1, newSize);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center animate-fade-in">
          <AlertCircle size={36} className="text-error mx-auto mb-3" />
          <p className="text-sm text-error font-medium mb-1">Error loading documents</p>
          <p className="text-xs text-text-muted mb-4">{error}</p>
          <button
            onClick={() => fetchDocuments(page, pageSize)}
            className="px-4 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-primary bg-bg-secondary/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <FileJson2 size={14} className="text-mongo-green" />
            <span className="font-medium">{totalCount.toLocaleString()}</span>
            <span className="text-text-muted">documents</span>
          </div>
          <button
            onClick={() => fetchDocuments(page, pageSize)}
            disabled={loading}
            className="p-1 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span>Rows</span>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="bg-bg-primary border border-border-primary rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
            >
              {[25, 50, 100, 200].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <span>
              {page} / {totalPages || 1}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handlePageChange(1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        {loading && documents.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-accent" />
              <p className="text-xs text-text-muted">Loading documents...</p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileJson2 size={36} className="text-border-primary mx-auto mb-3" />
              <p className="text-sm text-text-muted">No documents in this collection</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-bg-primary/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-accent" />
              </div>
            )}
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="bg-bg-tertiary text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider px-3 py-2 border-b border-border-primary whitespace-nowrap"
                        style={{ width: header.getSize() }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border-subtle hover:bg-bg-hover/50 transition-colors ${
                      index % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary/30'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2 max-w-xs truncate align-top"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
