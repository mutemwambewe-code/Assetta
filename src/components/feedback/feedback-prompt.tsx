'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { sendFeedbackEmail } from '@/app/actions/send-feedback-email';
import { Loader2, MessageCircleQuestion } from 'lucide-react';

const SESSION_COUNT_KEY = 'assetta_sessionCount';
const FEEDBACK_SUBMITTED_KEY = 'assetta_feedbackSubmitted';
const SESSION_THRESHOLD = 3; // Show prompt on the 3rd session

const formSchema = z.object({
  feedback: z.string().min(10, { message: "Please provide at least 10 characters of feedback." }),
});

type FormData = z.infer<typeof formSchema>;

export function FeedbackPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // This logic runs only on the client side
    if (typeof window === 'undefined') return;

    // Check if feedback has already been submitted
    const hasSubmitted = localStorage.getItem(FEEDBACK_SUBMITTED_KEY) === 'true';
    if (hasSubmitted) {
      return;
    }
    
    // Check if this is a new session
    const isNewSession = !sessionStorage.getItem('assetta_sessionActive');
    if (isNewSession) {
      sessionStorage.setItem('assetta_sessionActive', 'true');
      
      // Increment session count
      let sessionCount = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
      sessionCount++;
      localStorage.setItem(SESSION_COUNT_KEY, sessionCount.toString());

      // Check if we should show the prompt
      if (sessionCount >= SESSION_THRESHOLD) {
        setIsOpen(true);
      }
    }
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormData) {
    try {
      const result = await sendFeedbackEmail(values.feedback, {
        email: user?.email,
        name: user?.displayName,
      });

      if (result.success) {
        toast({
          title: 'Feedback Sent!',
          description: "Thank you for helping us improve Assetta.",
        });
        localStorage.setItem(FEEDBACK_SUBMITTED_KEY, 'true');
        setIsOpen(false);
        form.reset();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Feedback',
        description: error.message || "Something went wrong. Please try again.",
      });
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
            <div className="p-3 bg-primary/10 rounded-full w-fit mb-2">
                <MessageCircleQuestion className="h-8 w-8 text-primary" />
            </div>
          <DialogTitle className="text-xl">Help Us Improve!</DialogTitle>
          <DialogDescription>
            We'd love to hear your thoughts. What features would you like to see, and how can we make Assetta better for you?
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'It would be great if I could export reports for a custom date range...'"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Maybe Later
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Feedback
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
