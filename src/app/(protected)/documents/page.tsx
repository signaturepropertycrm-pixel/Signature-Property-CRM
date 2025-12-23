
'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText, Download, Trash2, Search, Link as LinkIcon, FileArchive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage } from '@/firebase/provider';
import { useProfile } from '@/context/profile-context';
import { useGetCollection } from '@/firebase/firestore/use-get-collection';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Property, UploadedDocument } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemoFirebase } from '@/firebase/hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function DocumentsPage() {
    const [file, setFile] = useState<File | null>(null);
    const [documentName, setDocumentName] = useState('');
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { toast } = useToast();
    const firestore = useFirestore();
    const storage = useStorage();
    const { profile } = useProfile();

    const propertiesQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, [firestore, profile.agency_id]);
    const { data: properties, isLoading: isLoadingProperties } = useGetCollection<Property>(propertiesQuery);
    
    const allDocuments = useMemo(() => {
        if (!properties) return [];
        return properties.flatMap(p => 
            (p.uploaded_documents || []).map(doc => ({
                ...doc,
                propertyId: p.id,
                propertySerial: p.serial_no,
                propertyTitle: p.auto_title
            }))
        ).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    }, [properties]);

    const filteredDocuments = useMemo(() => {
        if (!searchQuery) return allDocuments;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return allDocuments.filter(doc => 
            doc.name.toLowerCase().includes(lowerCaseQuery) ||
            doc.propertySerial.toLowerCase().includes(lowerCaseQuery) ||
            doc.propertyTitle.toLowerCase().includes(lowerCaseQuery)
        );
    }, [allDocuments, searchQuery]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                toast({ title: "File too large", description: "Please select a file smaller than 10MB.", variant: "destructive" });
                return;
            }
            setFile(selectedFile);
            setDocumentName(selectedFile.name.split('.').slice(0, -1).join('.'));
        }
    };

    const handleUpload = async () => {
        if (!file || !documentName || !selectedPropertyId || !profile.agency_id) {
            toast({ title: "Missing Information", description: "Please select a property, a file, and provide a name.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        try {
            const uniqueFileName = `${new Date().getTime()}-${file.name}`;
            const filePath = `documents/${profile.agency_id}/${selectedPropertyId}/${uniqueFileName}`;
            const fileStorageRef = storageRef(storage, filePath);

            const uploadResult = await uploadBytes(fileStorageRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            const newDocument: UploadedDocument = {
                name: documentName,
                url: downloadURL,
                uploadedAt: new Date().toISOString(),
                fileName: uniqueFileName,
            };

            const propertyRef = doc(firestore, 'agencies', profile.agency_id, 'properties', selectedPropertyId);
            await updateDoc(propertyRef, {
                uploaded_documents: arrayUnion(newDocument)
            });
            
            toast({ title: "Document Uploaded", description: `${documentName} has been successfully added.` });
            setFile(null);
            setDocumentName('');
            setSelectedPropertyId('');
            if(fileInputRef.current) fileInputRef.current.value = "";

        } catch (error) {
            console.error("Error uploading document:", error);
            toast({ title: "Upload Failed", description: "Could not upload the document.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };
  
    const handleDelete = async (docToDelete: (UploadedDocument & { propertyId: string })) => {
        if (!profile.agency_id) return;
        
        try {
            const batch = writeBatch(firestore);
            
            // Reference to the document in storage
            const filePath = `documents/${profile.agency_id}/${docToDelete.propertyId}/${docToDelete.fileName}`;
            const fileStorageRef = storageRef(storage, filePath);
            
            // Delete from Storage
            try {
              await deleteObject(fileStorageRef);
            } catch (storageError: any) {
              if (storageError.code !== 'storage/object-not-found') {
                throw storageError; // Re-throw if it's not a "not found" error
              }
               // If object not found, we can still proceed to remove from DB
               console.warn("File not found in storage, but removing DB reference:", filePath);
            }

            // Remove from Firestore
            const propertyRef = doc(firestore, 'agencies', profile.agency_id, 'properties', docToDelete.propertyId);
            
            // We need to create a plain object for arrayRemove
            const docToRemoveFromFirestore: UploadedDocument = {
              name: docToDelete.name,
              url: docToDelete.url,
              uploadedAt: docToDelete.uploadedAt,
              fileName: docToDelete.fileName
            };

            batch.update(propertyRef, {
                uploaded_documents: arrayRemove(docToRemoveFromFirestore)
            });

            await batch.commit();
            toast({ title: "Document Deleted", variant: 'destructive' });

        } catch (error) {
            console.error("Error deleting document:", error);
            toast({ title: "Deletion Failed", description: "Could not delete the document.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><FileArchive/> Document Manager</h1>
                <p className="text-muted-foreground">
                Upload and manage all your property documents in one place.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload New Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>1. Select Property</Label>
                             <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedPropertyId ? properties?.find(p => p.id === selectedPropertyId)?.auto_title : "Select property..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search property..." />
                                        <CommandList>
                                        <CommandEmpty>No properties found.</CommandEmpty>
                                        <CommandGroup>
                                            {properties?.map((prop) => (
                                            <CommandItem
                                                key={prop.id}
                                                onSelect={() => {
                                                    setSelectedPropertyId(prop.id);
                                                    setPopoverOpen(false);
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", selectedPropertyId === prop.id ? "opacity-100" : "opacity-0")} />
                                                {prop.auto_title} ({prop.serial_no})
                                            </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                             <Label>2. Document Name</Label>
                             <Input 
                                placeholder="e.g., Registry, Fard, NOC..." 
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                            />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label>3. Choose File</Label>
                         <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            {file ? `Selected: ${file.name}` : 'Choose file to upload (Max 10MB)'}
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                     </div>
                </CardContent>
                <CardFooter>
                     <Button onClick={handleUpload} disabled={isUploading || !file || !documentName || !selectedPropertyId}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload Document
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Uploaded Documents</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by doc name or property..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Document Name</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Date Uploaded</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingProperties ? (
                                    <TableRow><TableCell colSpan={4} className="text-center">Loading documents...</TableCell></TableRow>
                                ) : filteredDocuments.length > 0 ? (
                                    filteredDocuments.map((doc, index) => (
                                        <TableRow key={`${doc.propertyId}-${index}`}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {doc.name}
                                            </TableCell>
                                            <TableCell>{doc.propertyTitle} ({doc.propertySerial})</TableCell>
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
                                                    <AlertDialogAction onClick={() => handleDelete(doc)}>Confirm & Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                            No documents found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
