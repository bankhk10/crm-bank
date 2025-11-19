"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import Tooltip from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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

export default function CompanyCard({ id, name, shortName, email, phone, taxId, status, onDelete }: Props) {
  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            {shortName ? <div className="text-sm text-muted-foreground">{shortName}</div> : null}
          </div>
          <div className={cn("text-xs font-medium px-2 py-1 rounded", status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : status === "INACTIVE" ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800")}>{status ?? "PROSPECT"}</div>
        </div>

        <div className="mt-3 text-sm text-slate-600 space-y-1">
          {email ? <div><span className="font-medium">Email: </span>{email}</div> : null}
          {phone ? <div><span className="font-medium">Phone: </span>{phone}</div> : null}
          {taxId ? <div><span className="font-medium">Tax ID: </span>{taxId}</div> : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Tooltip content={`ดู ${name}`} side="top">
          <Button asChild size="icon-sm" variant="ghost" aria-label={`ดู ${name}`}>
            <Link href={`/companies/${id}`}>
              <Eye className="size-4" />
            </Link>
          </Button>
        </Tooltip>

        <Tooltip content={`แก้ไข ${name}`} side="top">
          <Button asChild size="icon-sm" variant="outline" aria-label={`แก้ไข ${name}`}>
            <Link href={`/companies/${id}/edit`}>
              <Edit className="size-4" />
            </Link>
          </Button>
        </Tooltip>

        {onDelete ? (
          <Tooltip content={`ลบ ${name}`} side="top">
            <Button variant="destructive" size="icon-sm" onClick={() => onDelete(id)} aria-label={`ลบ ${name}`}>
              <Trash2 className="size-4" />
            </Button>
          </Tooltip>
        ) : null}
      </div>
    </Card>
  );
}
