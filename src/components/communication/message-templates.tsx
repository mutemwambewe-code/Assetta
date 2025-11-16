
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, RotateCcw, Trash, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTemplates } from "./template-provider";
import { AddTemplate } from "./add-template";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import type { Template } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Separator } from "../ui/separator";

interface MessageTemplatesProps {
    onTemplateSelect: (content: string) => void;
}

export function MessageTemplates({ onTemplateSelect }: MessageTemplatesProps) {
  const { toast } = useToast();
  const { 
      activeTemplates, 
      trashedTemplates, 
      isInitialized, 
      trashTemplate, 
      restoreTemplate, 
      permanentlyDeleteTemplate 
    } = useTemplates();
  
  const handleTrash = (template: Template) => {
    trashTemplate(template.id);
    toast({
      title: "Template Moved to Trash",
      description: `"${template.title}" can be restored from the trash.`,
    });
  }
  
  const handleRestore = (template: Template) => {
    restoreTemplate(template.id);
    toast({
        title: "Template Restored",
        description: `"${template.title}" has been restored.`,
    });
  }

  const handlePermanentDelete = (template: Template) => {
    permanentlyDeleteTemplate(template.id);
    toast({
        title: "Template Permanently Deleted",
        description: `"${template.title}" has been removed forever.`,
    });
  }

  const groupedTemplates = activeTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof activeTemplates>);
    
  if (!isInitialized) {
    return <div>Loading templates...</div>;
  }

  return (
    <Card className="mt-6 border-t pt-6 border-dashed">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Message Templates</CardTitle>
                    <CardDescription>Select a template to quickly compose a message.</CardDescription>
                </div>
                <AddTemplate />
            </div>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" defaultValue={["Rent Reminders"]} className="w-full">
                {Object.entries(groupedTemplates).map(([category, items]) => (
                     <AccordionItem value={category} key={category}>
                        <AccordionTrigger className="text-lg font-semibold">{category}</AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {items.map(template => (
                                    <Card 
                                        key={template.id} 
                                        className="flex flex-col cursor-pointer hover:border-primary"
                                        onClick={() => onTemplateSelect(template.content)}
                                    >
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base flex-grow">{template.title}</CardTitle>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2" onClick={(e) => e.stopPropagation()}>
                                                            <MoreVertical className="h-4 w-4"/>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem className="text-destructive" onClick={(e) => {e.stopPropagation(); handleTrash(template)}}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Move to Trash
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <p className="text-sm text-muted-foreground">{template.content}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            
            {trashedTemplates.length > 0 && (
                <>
                <Separator className="my-6"/>
                <Accordion type="single" collapsible>
                    <AccordionItem value="trash">
                        <AccordionTrigger className="text-lg font-semibold text-destructive">
                            <div className="flex items-center gap-2">
                                <Trash className="h-5 w-5"/>
                                Trash ({trashedTemplates.length})
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-3">
                            {trashedTemplates.map(template => (
                                <div key={template.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                                    <div>
                                        <p className="font-medium">{template.title}</p>
                                        <p className="text-xs text-muted-foreground">{template.category}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleRestore(template)}>
                                            <RotateCcw className="mr-2 h-4 w-4"/> Restore
                                        </Button>
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <Trash2 className="mr-2 h-4 w-4"/> Delete Forever
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the template "{template.title}".
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handlePermanentDelete(template)} className="bg-destructive hover:bg-destructive/90">
                                                        Yes, delete forever
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                </>
            )}

        </CardContent>
    </Card>
  );
}
