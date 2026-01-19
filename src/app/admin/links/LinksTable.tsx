"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  featured: boolean;
  isActive: boolean;
  order: number;
}

export default function LinksTable({ links: initialLinks }: { links: LinkItem[] }) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/links/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLinks(links.filter((l) => l.id !== id));
        router.refresh();
      } else {
        alert("Failed to delete link");
      }
    } catch {
      alert("Failed to delete link");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (link: LinkItem) => {
    try {
      const res = await fetch(`/api/admin/links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...link, isActive: !link.isActive }),
      });

      if (res.ok) {
        setLinks(
          links.map((l) =>
            l.id === link.id ? { ...l, isActive: !l.isActive } : l
          )
        );
        router.refresh();
      } else {
        alert("Failed to update link");
      }
    } catch {
      alert("Failed to update link");
    }
  };

  const handleToggleFeatured = async (link: LinkItem) => {
    try {
      const res = await fetch(`/api/admin/links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...link, featured: !link.featured }),
      });

      if (res.ok) {
        setLinks(
          links.map((l) =>
            l.id === link.id ? { ...l, featured: !l.featured } : l
          )
        );
        router.refresh();
      } else {
        alert("Failed to update link");
      }
    } catch {
      alert("Failed to update link");
    }
  };

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      const newLinks = [...links];
      const draggedLink = newLinks[draggedIndex];
      newLinks.splice(draggedIndex, 1);
      newLinks.splice(index, 0, draggedLink);

      setLinks(newLinks);
      setDraggedIndex(index);
    },
    [draggedIndex, links]
  );

  const handleDragEnd = useCallback(async () => {
    setDraggedIndex(null);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkIds: links.map((l) => l.id) }),
      });

      if (!res.ok) {
        alert("Failed to save order");
      }
    } catch {
      alert("Failed to save order");
    } finally {
      setSaving(false);
    }
  }, [links]);

  if (links.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No links found</p>
        <Link
          href="/admin/links/new"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Add your first link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {saving && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Saving order...
        </div>
      )}
      {links.map((link, index) => (
        <div
          key={link.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-move hover:shadow-md transition-shadow ${
            draggedIndex === index ? "opacity-50" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Drag handle */}
            <div className="text-gray-400 dark:text-gray-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </div>

            {/* Link info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {link.title}
                </h3>
                {link.featured && (
                  <span className="flex-shrink-0 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {link.url}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleToggleFeatured(link)}
                className={`p-1.5 rounded ${
                  link.featured
                    ? "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title={link.featured ? "Unfeature" : "Feature"}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>

              <button
                onClick={() => handleToggleActive(link)}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  link.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {link.isActive ? "Active" : "Inactive"}
              </button>

              <Link
                href={`/admin/links/${link.id}/edit`}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>

              <button
                onClick={() => handleDelete(link.id)}
                disabled={deleting === link.id}
                className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
