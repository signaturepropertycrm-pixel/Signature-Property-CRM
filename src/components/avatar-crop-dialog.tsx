
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Loader2 } from 'lucide-react';

interface AvatarCropDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAvatarSave: (dataUrl: string) => Promise<void>;
}

export function AvatarCropDialog({ isOpen, setIsOpen, onAvatarSave }: AvatarCropDialogProps) {
  const { toast } = useToast();
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [isLoading, setIsLoading] = useState(false);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(crop);
  }

  const handleSave = async () => {
    if (!imgRef.current || !crop || !crop.width || !crop.height) {
      toast({ title: 'Error', description: 'Could not process image.', variant: 'destructive'});
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        toast({ title: 'Error', description: 'Canvas context not available.', variant: 'destructive'});
        return;
    }

    ctx.drawImage(
      imgRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const dataUrl = canvas.toDataURL('image/jpeg');
    setIsLoading(true);
    await onAvatarSave(dataUrl);
    setIsLoading(false);
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Update Profile Picture</DialogTitle>
          <DialogDescription>
            Select and crop your new profile picture.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <Input type="file" accept="image/*" onChange={onSelectFile} />
            {imgSrc && (
                <div className="flex justify-center">
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        aspect={1}
                        circularCrop
                    >
                        <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview" style={{ maxHeight: '70vh' }}/>
                    </ReactCrop>
                </div>
            )}
        </div>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!imgSrc || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Save Picture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

