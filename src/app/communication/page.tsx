
'use client';

import { Suspense } from "react";
import dynamic from "next/dynamic";

const CommunicationCenter = dynamic(
  () => import('@/components/communication/communication-center').then(mod => mod.CommunicationCenter),
  {
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-96">Loading Communication Center...</div>,
  }
);


function CommunicationPage({ title }: { title?: string }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-96">Loading...</div>}>
        <CommunicationCenter />
    </Suspense>
  );
}

CommunicationPage.title = 'Communication Center';
export default CommunicationPage;
