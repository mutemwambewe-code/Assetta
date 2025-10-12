
'use client';
import { PropertyList } from "@/components/properties/property-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PropertiesPage({ title }: { title?: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Property Management</h1>
          <p className="text-muted-foreground">
            View, add, and manage your properties.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      </div>
      <PropertyList />
    </div>
  );
}

PropertiesPage.title = "Property Management";
