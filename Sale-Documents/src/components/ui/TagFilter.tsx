"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const tags = [
  { label: "Tất cả", value: "" },
  { label: "Bài tập", value: "Bài tập" },
  { label: "Lý thuyết", value: "Lý thuyết" },
  { label: "Đề thi", value: "Đề thi" }
];

export function TagFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTag = searchParams.get("tag") || "";

  const handleTagClick = (tagValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tagValue) {
      params.set("tag", tagValue);
    } else {
      params.delete("tag");
    }
    
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {tags.map((tag) => {
        const isActive = currentTag === tag.value;
        return (
          <button
            key={tag.label}
            onClick={() => handleTagClick(tag.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              isActive 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
