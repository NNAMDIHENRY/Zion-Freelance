"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export function useSearchUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const replaceParams = React.useCallback(
    (mutate: (q: URLSearchParams) => void, opts?: { resetPage?: boolean }) => {
      const q = new URLSearchParams(searchParams.toString());
      mutate(q);
      if (opts?.resetPage !== false) q.delete("page");
      const s = q.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { replaceParams, searchParams };
}
