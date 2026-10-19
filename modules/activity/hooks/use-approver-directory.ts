"use client";

import { useState, useEffect } from "react";
import { getApproverDirectoryAction } from "../server/actions";

export interface ApproverDirectory {
  salesAdminEmployees: string[];
  marketingEmployees: string[];
  salesDirectorEmployees: string[];
}

let cachedDirectory: ApproverDirectory | null = null;
let directoryPromise: Promise<ApproverDirectory> | null = null;

/**
 * Client-side hook for retrieving and caching the directory of authorized approvers.
 */
export function useApproverDirectory(): ApproverDirectory | null {
  const [directory, setDirectory] = useState<ApproverDirectory | null>(
    cachedDirectory,
  );

  useEffect(() => {
    if (cachedDirectory) return;

    if (!directoryPromise) {
      directoryPromise = getApproverDirectoryAction()
        .then((res) => {
          cachedDirectory = res;
          return res;
        })
        .catch((err) => {
          console.error("Failed to load approver directory:", err);
          return {
            salesAdminEmployees: [],
            marketingEmployees: [],
            salesDirectorEmployees: [],
          };
        });
    }

    let isMounted = true;
    directoryPromise.then((data) => {
      if (isMounted) setDirectory(data);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return directory;
}
