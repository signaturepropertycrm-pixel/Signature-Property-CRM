
'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Property } from '@/lib/types';
import { useEffect } from 'react';

const formSchema = z.object({
  tiktok: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  other: z.string().url().optional().or(z.literal('')),
});

type RecordVideoFormValues = z.infer<typeof formSchema>;

interface RecordVideoDialogProps {
  property: Property;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onUpdateProperty: (updatedProperty: Property) => void;
}

export function RecordVideoDialog({
  property,
  isOpen,
  setIsOpen,
  onUpdateProperty,
}: RecordVideoDialogProps) {
  const { toast } = useToast();
  const form = useForm<RecordVideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tiktok: property.video_links?.tiktok || '',
      youtube: property.video_links?.youtube || '',
      instagram: property.video_links?.instagram || '',
      facebook: property.video_links?.facebook || '',
      other: property.video_links?.other || '',
    },
  });

  const { reset } = form;

  useEffect(() => {
    reset({
      tiktok: property.video_links?.tiktok || '',
      youtube: property.video_links?.youtube || '',
      instagram: property.video_links?.instagram || '',
      facebook: property.video_links?.facebook || '',
      other: property.video_links?.other || '',
    });
  }, [property, reset]);


  function onSubmit(values: RecordVideoFormValues) {
    const hasLinks = Object.values(values).some(link => !!link);
    const updatedProperty: Property = {
        ...property,
        is_recorded: hasLinks,
        video_links: values
    };
    onUpdateProperty(updatedProperty);

    toast({
      title: 'Video Links Saved',
      description: `Links for ${property.auto_title} have been updated.`,
    });
    setIsOpen(false);
  }

  function handleClear() {
    const updatedProperty: Property = {
        ...property,
        is_recorded: false,
        video_links: {}
    };
    onUpdateProperty(updatedProperty);
    toast({
        title: 'Links Cleared',
        description: `All video links for ${property.auto_title} have been removed. The property is no longer marked as recorded.`,
    });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Record Video Links</DialogTitle>
          <DialogDescription>
            Add video links for {property.auto_title}. The property will be marked as 'Recorded' if at least one link is provided.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tiktok"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TikTok</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://tiktok.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="youtube"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://youtube.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://instagram.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://facebook.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="other"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between gap-2 pt-4">
               <div>
                {property.is_recorded && (
                    <Button type="button" variant="destructive" onClick={handleClear}>Clear all links</Button>
                )}
               </div>
               <div className="flex gap-2">
                 <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                >
                    Cancel
                </Button>
                <Button type="submit">Save</Button>
               </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
