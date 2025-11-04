
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/lib/types';
import { Copy, Share2, Loader2, Check } from 'lucide-react';
import { generateShareableText } from '@/lib/actions';
import { ShareableTextOutput } from '@/ai/flows/shareable-text-generation';


interface SharePropertyDialogProps {
  property: Property;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function SharePropertyDialog({
  property,
  isOpen,
  setIsOpen,
}: SharePropertyDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState<ShareableTextOutput | null>(null);
  const [copied, setCopied] = useState<'customer' | 'agent' | null>(null);

  const handleGenerateText = async () => {
    setLoading(true);
    setGeneratedText(null);
    try {
      const result = await generateShareableText(property);
      setGeneratedText(result);
    } catch (error: any) {
      console.error('Failed to generate text', error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Text',
        description: error.message || 'Failed to generate shareable text.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !generatedText) {
      handleGenerateText();
    }
  }, [isOpen]);

  const handleCopy = (text: string, type: 'customer' | 'agent') => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async (text: string) => {
    try {
        if (navigator.share) {
            await navigator.share({
                title: property.auto_title,
                text: text,
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            handleCopy(text, 'customer'); // or 'agent', doesn't matter much here
            toast({ title: 'Link copied!', description: "Sharing not supported, text copied to clipboard."});
        }
    } catch (error) {
        console.error('Sharing failed', error);
        toast({ variant: 'destructive', title: 'Could not share', description: 'There was an error trying to share.'});
    }
  };


  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setGeneratedText(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">
            Share Property: {property.auto_title}
          </DialogTitle>
        </DialogHeader>

        {!generatedText && (
          <div className="flex justify-center items-center h-40">
            <Button onClick={handleGenerateText} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Details
            </Button>
          </div>
        )}

        {loading && (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                <p>Generating shareable content...</p>
             </div>
        )}

        {generatedText && !loading && (
          <Tabs defaultValue="customer">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">For Customer</TabsTrigger>
              <TabsTrigger value="agent">For Agent</TabsTrigger>
            </TabsList>
            <TabsContent value="customer">
              <Textarea
                readOnly
                value={generatedText.forCustomer}
                className="h-60 mt-4"
              />
              <div className="flex gap-2 mt-4">
                 <Button className="w-full" onClick={() => handleCopy(generatedText.forCustomer, 'customer')}>
                    {copied === 'customer' ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                    {copied === 'customer' ? 'Copied' : 'Copy'}
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleShare(generatedText.forCustomer)}>
                    <Share2 className="mr-2" /> Share
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="agent">
              <Textarea
                readOnly
                value={generatedText.forAgent}
                className="h-60 mt-4"
              />
               <div className="flex gap-2 mt-4">
                 <Button className="w-full" onClick={() => handleCopy(generatedText.forAgent, 'agent')}>
                    {copied === 'agent' ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                    {copied === 'agent' ? 'Copied' : 'Copy'}
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleShare(generatedText.forAgent)}>
                    <Share2 className="mr-2" /> Share
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="sm:justify-start">
           <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    