"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  name: string;
  shortName?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  industry?: string | null;
  status?: string | null;
  onDelete?: (id: string) => void;
};

export default function CompanyCard({ id, name, shortName, email, phone, taxId, industry, status, onDelete }: Props) {
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
          {industry ? <div><span className="font-medium">Industry: </span>{industry}</div> : null}
          {email ? <div><span className="font-medium">Email: </span>{email}</div> : null}
          {phone ? <div><span className="font-medium">Phone: </span>{phone}</div> : null}
          {taxId ? <div><span className="font-medium">Tax ID: </span>{taxId}</div> : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Link href={`/companies/${id}`} className="text-sm">
          <Button variant="outline" size="sm">View</Button>
        </Link>
        <Link href={`/companies/${id}/edit`} className="text-sm">
          <Button size="sm">Edit</Button>
        </Link>
        {onDelete ? (
          <Button variant="ghost" size="sm" onClick={() => onDelete(id)}>
            Delete
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
