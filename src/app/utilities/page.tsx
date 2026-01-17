'use client';

import { UtilityList } from "@/components/utilities/utility-list";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UtilitiesPage({ title }: { title?: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utility Management</h1>
          <p className="text-muted-foreground">
            Track and manage utility bills for your properties.
          </p>
        </div>
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      </div>
      <Suspense fallback={<div>Loading utilities...</div>}>
        <UtilityList />
      </Suspense>
    </div>
  );
}

UtilitiesPage.title = "Utility Management";
