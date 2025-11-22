
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { User as TeamMember } from '@/lib/types';
import Image from 'next/image';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


interface UpdateMemberAvatarDialogProps {
  member: TeamMember;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (memberId: string, dataUrl: string) => void;
}

export function UpdateMemberAvatarDialog({
  member,
  isOpen,
  setIsOpen,
  onSave,
}: UpdateMemberAvatarDialogProps) {
  const { toast } = useToast();
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCrop(undefined); // Reset crop on new image
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
    setCompletedCrop(crop);
  };
  
  useEffect(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
  }, [completedCrop]);

  const handleSave = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) {
      toast({ title: 'Please select an image to save.', variant: 'destructive' });
      return;
    }
    
    const image = document.createElement('img');
    image.src = canvas.toDataURL('image/png');
    image.onload = () => {
        const finalCanvas = document.createElement('canvas');
        const MAX_DIMENSION = 256;
        finalCanvas.width = MAX_DIMENSION;
        finalCanvas.height = MAX_DIMENSION;
        const ctx = finalCanvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, MAX_DIMENSION, MAX_DIMENSION);
        const dataUrl = finalCanvas.toDataURL('image/png');
        onSave(member.id, dataUrl);
    };
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Picture for {member.name}</DialogTitle>
          <DialogDescription>Upload and crop a new image for this team member.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          {imgSrc && (
            <div className="flex flex-col items-center gap-4 mt-4">
                <ReactCrop
                    crop={crop}
                    onChange={c => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                    style={{ maxHeight: '50vh' }}
                >
                    <Image
                        ref={imgRef}
                        alt="Crop me"
                        src={imgSrc}
                        width={0}
                        height={0}
                        sizes="100vw"
                        style={{ width: '100%', height: 'auto' }}
                        onLoad={onImageLoad}
                    />
                </ReactCrop>
                <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!imgSrc}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
