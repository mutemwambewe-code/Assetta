'use client';

import { CommunicationCenter } from "@/components/communication/communication-center";
import { Suspense } from "react";

function CommunicationPage({ title }: { title?: string }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
        <CommunicationCenter />
    </Suspense>
  );
}

CommunicationPage.title = 'Communication Center';
export default CommunicationPage;
