// File: src/components/ai-assistant.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Save, Bot } from 'lucide-react';
import { analyzeRealEstateText } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/context/profile-context';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useUser } from '@/firebase/auth/use-user';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const { profile } = useProfile();
  const { user } = useUser();
  const firestore = useFirestore();

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);
    
    const data = await analyzeRealEstateText(inputText);
    
    if (data) {
      setResult(data);
      toast({ title: "Analysis Complete", description: `Detected: ${data.type}` });
    } else {
      toast({ title: "AI Error", description: "Kuch samajh nahi aya. Dobara try karen.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile.agency_id || !result || !user?.uid) {
        toast({ title: "Error", description: "User or Agency missing.", variant: "destructive" });
        return;
    }
    setLoading(true);

    try {
      if (result.type === 'Buyer') {
        // Buyer Logic
        // Clean up undefined values before saving
        const cleanData = JSON.parse(JSON.stringify(result.data));
        
        await addDoc(collection(firestore, 'agencies', profile.agency_id, 'buyers'), {
          ...cleanData,
          status: 'New',
          serial_no: `AI-${Math.floor(Math.random() * 1000)}`, // Temporary serial
          created_at: new Date().toISOString(),
          created_by: user.uid,
          agency_id: profile.agency_id,
          is_deleted: false,
          listing_type: cleanData.listing_type || 'For Sale'
        });
        toast({ title: "Success", description: "Buyer Lead Saved Successfully!" });

      } else {
        // Property Logic
        const cleanData = JSON.parse(JSON.stringify(result.data));

        await addDoc(collection(firestore, 'agencies', profile.agency_id, 'properties'), {
          ...cleanData,
          status: 'Available',
          created_at: new Date().toISOString(),
          created_by: user.uid,
          agency_id: profile.agency_id,
          is_deleted: false
        });
        toast({ title: "Success", description: "Property Saved Successfully!" });
      }
      
      setIsOpen(false);
      setInputText('');
      setResult(null);

    } catch (error) {
      console.error(error);
      toast({ title: "Database Error", description: "Save nahi ho saka.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Animated Button */}
       <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                     <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button 
                          onClick={() => setIsOpen(true)}
                          size="icon"
                          className="rounded-full w-14 h-14 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl border-2 border-white/30 flex flex-col items-center justify-center gap-0 p-0"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-6 w-6 text-white" />
                          </motion.div>
                           <span className="text-[9px] font-bold text-white mt-[-2px]">AI</span>
                        </Button>
                      </motion.div>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>AI Quick Add</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

      {/* AI Dialog Box */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-headline">
               <Bot className="text-purple-600 h-6 w-6" /> 
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                 Signature AI Agent
               </span>
            </DialogTitle>
            <DialogDescription>
              Koi bhi WhatsApp message, SMS, ya details yahan paste karen. AI khud data nikal lega.
            </DialogDescription>
          </DialogHeader>

          {!result ? (
            <div className="space-y-4 py-4">
              <Textarea 
                placeholder="Paste here... e.g.: 'Aslam o alikum, I need 10 marla plot in DHA Phase 7, range 3 crore.'"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[150px] text-base p-4 border-2 focus-visible:ring-purple-500"
              />
              <Button onClick={handleAnalyze} disabled={loading || !inputText} className="w-full h-12 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all shadow-lg">
                {loading ? (
                    <>
                        <Loader2 className="animate-spin mr-2" /> Soch raha hon...
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-5 w-5" /> Analyze Magic
                    </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant={result.type === 'Buyer' ? 'default' : 'secondary'} className="text-base px-4 py-1 uppercase tracking-wider">
                        {result.type === 'Buyer' ? '👤 Buyer Detected' : '🏠 Property Detected'}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="text-muted-foreground hover:text-destructive">
                    Restart
                  </Button>
              </div>
              
              {/* Form Preview */}
              <div className="grid gap-4 border p-5 rounded-xl bg-card shadow-sm">
                <p className="text-sm font-medium text-muted-foreground mb-2">Review Extracted Data:</p>
                {Object.entries(result.data).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right capitalize text-xs text-muted-foreground font-semibold">
                        {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Input 
                      className="col-span-3 h-9 font-medium" 
                      value={value as string || ''} 
                      onChange={(e) => setResult({...result, data: {...result.data, [key]: e.target.value}})}
                    />
                  </div>
                ))}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md">
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  Confirm & Save to CRM
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
