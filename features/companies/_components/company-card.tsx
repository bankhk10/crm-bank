"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { CompanyStatusBadge } from "./company-status-badge";

type Props = {
  id: string;
  name: string;
  shortName?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  status?: string | null;
  onDelete?: (id: string) => void;
};

export default function CompanyCard({
  id,
  name,
  shortName,
  email,
  phone,
  taxId,
  status,
  onDelete,
}: Props) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 1)
    .join("")
    .toUpperCase();

  return (
    <Card className="flex flex-col justify-between h-full p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-semibold text-slate-700">
            {initials}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold leading-5">{name}</h3>
              {shortName ? (
                <div className="text-sm text-muted-foreground mt-1">
                  {shortName}
                </div>
              ) : null}
            </div>
            <CompanyStatusBadge status={status || undefined} />
          </div>

          <div className="mt-3 text-sm text-slate-600 space-y-1">
            {email ? (
              <div>
                <span className="font-medium">Email: </span>
                {email}
              </div>
            ) : null}
            {phone ? (
              <div>
                <span className="font-medium">Phone: </span>
                {phone}
              </div>
            ) : null}
            {taxId ? (
              <div>
                <span className="font-medium">Tax ID: </span>
                {taxId}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                size="icon-sm"
                variant="outline"
                className="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md h-8 w-8"
                aria-label={`ดู ${name}`}
              >
                <Link href={`/companies/${id}`}>
                  <Eye className="h-4 w-4 text-blue-600" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">ดู {name}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                size="icon-sm"
                variant="outline"
                className="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md h-8 w-8"
                aria-label={`แก้ไข ${name}`}
              >
                <Link href={`/companies/${id}/edit`}>
                  <Edit className="h-4 w-4 text-purple-600" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">แก้ไข {name}</TooltipContent>
          </Tooltip>

          {onDelete ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md h-8 w-8"
                  onClick={() => onDelete(id)}
                  aria-label={`ลบ ${name}`}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">ลบ {name}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
