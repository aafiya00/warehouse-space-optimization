import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  pageSize?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage, totalPages, onPageChange,
  showInfo = true, totalItems, pageSize,
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === totalPages ||
    (p >= currentPage - 1 && p <= currentPage + 1));

  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
      {showInfo && totalItems !== undefined && pageSize !== undefined && (
        <p className="text-sm text-gray-500">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">
          Previous
        </button>
        {visible.map((page, idx) => {
          const prev = visible[idx - 1];
          return (
            <React.Fragment key={page}>
              {prev && page - prev > 1 && <span className="px-2 text-gray-400">…</span>}
              <button
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 text-sm border rounded ${
                  page === currentPage
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "hover:bg-gray-50"
                }`}>
                {page}
              </button>
            </React.Fragment>
          );
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
