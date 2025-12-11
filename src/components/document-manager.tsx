
'use client';
import { useState, useRef } from 'react';
import { Property, UploadedDocument } from '@/lib/types';
import { useFirestore } from '@/firebase/provider';
import { useProfile } from '@/context/profile-context';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Upload, FileText, Download, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DocumentManagerProps {
  property: Property;
}

export function DocumentManager({ property }: DocumentManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useProfile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ title: "File too large", description: "Please select a file smaller than 10MB.", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
      setDocumentName(selectedFile.name.split('.').slice(0, -1).join('.')); // Pre-fill name without extension
    }
  };

  const handleUpload = async () => {
    if (!file || !documentName || !profile.agency_id) {
      toast({ title: "Missing Information", description: "Please select a file and provide a name.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const storage = getStorage();
      const uniqueFileName = `${new Date().getTime()}-${file.name}`;
      const filePath = `documents/${profile.agency_id}/${property.id}/${uniqueFileName}`;
      const fileStorageRef = storageRef(storage, filePath);

      const uploadResult = await uploadBytes(fileStorageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const newDocument: UploadedDocument = {
        name: documentName,
        url: downloadURL,
        uploadedAt: new Date().toISOString(),
        fileName: uniqueFileName,
      };

      const propertyRef = doc(firestore, 'agencies', profile.agency_id, 'properties', property.id);
      await updateDoc(propertyRef, {
        uploaded_documents: arrayUnion(newDocument)
      });
      
      toast({ title: "Document Uploaded", description: `${documentName} has been successfully added.` });
      setFile(null);
      setDocumentName('');
      if(fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Error uploading document:", error);
      toast({ title: "Upload Failed", description: "Could not upload the document.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };
  
    const handleDelete = async (docToDelete: UploadedDocument) => {
        if (!profile.agency_id) return;
        
        try {
            // Delete from Storage
            const storage = getStorage();
            const filePath = `documents/${profile.agency_id}/${property.id}/${docToDelete.fileName}`;
            const fileStorageRef = storageRef(storage, filePath);
            await deleteObject(fileStorageRef);

            // Remove from Firestore
            const propertyRef = doc(firestore, 'agencies', profile.agency_id, 'properties', property.id);
            await updateDoc(propertyRef, {
                uploaded_documents: arrayRemove(docToDelete)
            });

            toast({ title: "Document Deleted", variant: 'destructive' });

        } catch (error) {
            console.error("Error deleting document:", error);
            // Handle case where file doesn't exist in storage but is in DB
            if ((error as any).code === 'storage/object-not-found') {
                 const propertyRef = doc(firestore, 'agencies', profile.agency_id, 'properties', property.id);
                 await updateDoc(propertyRef, {
                    uploaded_documents: arrayRemove(docToDelete)
                });
                toast({ title: "Document record removed.", description: "The file was not found in storage but the record has been cleared." });
            } else {
                toast({ title: "Deletion Failed", description: "Could not delete the document.", variant: "destructive" });
            }
        }
    };


  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input 
            placeholder="Document Name (e.g., Registry)" 
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
        />
        <div className="md:col-span-2 flex gap-4">
             <Button type="button" variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {file ? `Selected: ${file.name}` : 'Choose File'}
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

            <Button onClick={handleUpload} disabled={isUploading || !file || !documentName}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload Document
            </Button>
        </div>
      </div>
      
      <div className="border rounded-lg mt-4">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Date Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {property.uploaded_documents && property.uploaded_documents.length > 0 ? (
                    property.uploaded_documents.map((doc, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                {doc.name}
                            </TableCell>
                            <TableCell>{format(new Date(doc.uploadedAt), 'PPP')}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button asChild variant="outline" size="icon">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                                </Button>
                                 <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the document "{doc.name}". This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(doc)}>Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                            No documents uploaded for this property yet.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
