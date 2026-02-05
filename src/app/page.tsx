'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/signup');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-2">
        <Image src="/login-heading.png" width={240} height={60} alt="Assetta" priority />
        <p className="text-muted-foreground text-center">Your assets - optimized.</p>
      </div>
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
