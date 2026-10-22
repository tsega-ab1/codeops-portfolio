import Link from "next/link";
import { listHref } from "@/lib/dashboard-data";

// Every page is a real <Link> to a real URL: back button, middle-click and sharing all work.
const base = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3";

export default function Pager({ list, demo }) {
  const { page, pages, sort, dir } = list;
  const href = (p) => listHref({ sort, dir, page: p, demo });

  return (
    <nav aria-label="Orders pages" className="mt-4 flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={base} rel="prev">Previous</Link>
      ) : (
        <span className={`${base} text-gray-400`} aria-disabled="true">Previous</span>
      )}

      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          aria-label={`Page ${p}`}
          className={`${base} ${p === page ? "bg-[#1B4D8E] text-white" : "bg-white"}`}
        >
          {p}
        </Link>
      ))}

      {page < pages ? (
        <Link href={href(page + 1)} className={base} rel="next">Next</Link>
      ) : (
        <span className={`${base} text-gray-400`} aria-disabled="true">Next</span>
      )}
    </nav>
  );
}
