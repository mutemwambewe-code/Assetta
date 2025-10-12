
'use client';

import { TenantList } from "@/components/tenants/tenant-list";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TenantsPage({ title }: { title?: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">
            View, manage, and communicate with your tenants.
          </p>
        </div>
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      </div>
      <Suspense fallback={<div>Loading tenants...</div>}>
        <TenantList />
      </Suspense>
    </div>
  );
}

TenantsPage.title = "Tenant Management";
