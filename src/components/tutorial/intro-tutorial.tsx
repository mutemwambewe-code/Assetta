
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTutorial } from './tutorial-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Button } from '../ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const tutorialSteps = [
    {
        id: 'step-1',
        title: "Welcome to Assetta!",
        description: "Your modern solution for managing properties and tenants in Zambia. Let's take a quick tour of the key features.",
        imageHint: 'welcome illustration'
    },
    {
        id: 'step-2',
        title: "The Dashboard",
        description: "This is your command center. Get a quick overview of total units, occupancy, rent collection, and tenants in arrears.",
        imageHint: 'dashboard screenshot'
    },
    {
        id: 'step-3',
        title: "Managing Tenants",
        description: "In the 'Tenants' section, you can view all your tenants, add new ones, and see their rent status at a glance.",
        imageHint: 'tenant list screenshot'
    },
    {
        id: 'step-4',
        title: "Easy Communication",
        description: "Use the 'Communication' page to send individual or bulk SMS reminders to your tenants. You can even use templates to save time!",
        imageHint: 'messaging screenshot'
    },
    {
        id: 'step-5',
        title: "Reports & Analytics",
        description: "Dive deep into your property performance with detailed reports on finances, occupancy, and more. Download PDFs or Excel files for your records.",
        imageHint: 'reports screenshot'
    },
    {
        id: 'step-6',
        title: "You're All Set!",
        description: "That's the basics! You're ready to start managing your properties like a pro. Click 'Finish' to get started.",
        imageHint: 'celebration illustration'
    }
]

export function IntroTutorial() {
    const { isTutorialOpen, closeTutorial } = useTutorial();
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!api) return;
        
        setCurrent(api.selectedScrollSnap());

        const handleSelect = () => {
            setCurrent(api.selectedScrollSnap());
        };

        api.on("select", handleSelect);

        return () => {
            api.off("select", handleSelect);
        };
    }, [api]);
    
    const isLastStep = current === tutorialSteps.length - 1;

    return (
        <Dialog open={isTutorialOpen} onOpenChange={(open) => !open && closeTutorial()}>
            <DialogContent className="sm:max-w-lg">
                <Carousel setApi={setApi} className="w-full">
                    <CarouselContent>
                        {tutorialSteps.map((step, index) => {
                            const image = PlaceHolderImages.find(p => p.id === step.id) ?? { imageUrl: `https://picsum.photos/seed/${index}/600/400`, imageHint: step.imageHint};
                            return(
                                <CarouselItem key={index}>
                                    <div className="p-1">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl">{step.title}</DialogTitle>
                                            <DialogDescription>{step.description}</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Image
                                                src={image.imageUrl}
                                                alt={step.title}
                                                width={600}
                                                height={400}
                                                data-ai-hint={image.imageHint}
                                                className="rounded-lg object-cover aspect-video"
                                            />
                                        </div>
                                    </div>
                                </CarouselItem>
                            )
                        })}
                    </CarouselContent>
                    <CarouselPrevious className="-left-4" />
                    <CarouselNext className="-right-4" />
                </Carousel>
                <DialogFooter className="flex-row justify-between items-center w-full">
                     <div className="flex gap-2">
                        {tutorialSteps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 w-2 rounded-full transition-all ${current === i ? 'p-1.5 bg-primary' : 'bg-muted'}`}
                            />
                        ))}
                    </div>
                    {isLastStep ? (
                        <Button onClick={closeTutorial}>Finish</Button>
                    ) : (
                        <Button onClick={() => api?.scrollNext()}>Next</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
