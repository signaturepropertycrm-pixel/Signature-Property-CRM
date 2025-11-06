
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { properties as initialProperties, buyers as initialBuyers } from '@/lib/data';
import type { Property, Buyer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function TrashPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedProperties = localStorage.getItem('properties');
    setProperties(savedProperties ? JSON.parse(savedProperties) : initialProperties);

    const savedBuyers = localStorage.getItem('buyers');
    setBuyers(savedBuyers ? JSON.parse(savedBuyers) : initialBuyers);
  }, []);
  
  useEffect(() => {
     if (properties.length > 0) {
      localStorage.setItem('properties', JSON.stringify(properties));
     }
  }, [properties]);
  
  useEffect(() => {
      if (buyers.length > 0) {
        localStorage.setItem('buyers', JSON.stringify(buyers));
      }
  }, [buyers]);

  const deletedProperties = properties.filter(p => p.is_deleted);
  const deletedBuyers = buyers.filter(b => b.is_deleted);
  
  const handleRestoreProperty = (id: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, is_deleted: false } : p));
    toast({ title: 'Property Restored', description: 'The property has been successfully restored.' });
  };
  
  const handlePermanentDeleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Property Deleted Permanently', variant: 'destructive', description: 'The property has been permanently removed.' });
  };
  
  const handleRestoreBuyer = (id: string) => {
    setBuyers(prev => prev.map(b => b.id === id ? { ...b, is_deleted: false } : b));
    toast({ title: 'Buyer Restored', description: 'The buyer has been successfully restored.' });
  };
  
  const handlePermanentDeleteBuyer = (id: string) => {
    setBuyers(prev => prev.filter(b => b.id !== id));
    toast({ title: 'Buyer Deleted Permanently', variant: 'destructive', description: 'The buyer has been permanently removed.' });
  };

  const PermanentDeleteDialog = ({ onConfirm }: { onConfirm: () => void }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete Permanently</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Trash</h1>
        <p className="text-muted-foreground">
          Manage and restore deleted items. Items are permanently deleted after 30 days.
        </p>
      </div>

      <Tabs defaultValue="properties">
        <TabsList>
          <TabsTrigger value="properties">Properties ({deletedProperties.length})</TabsTrigger>
          <TabsTrigger value="buyers">Buyers ({deletedBuyers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {deletedProperties.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No deleted properties.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial No</TableHead>
                      <TableHead>Property Title</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedProperties.map(prop => (
                      <TableRow key={prop.id}>
                        <TableCell><Badge variant="outline">{prop.serial_no}</Badge></TableCell>
                        <TableCell>{prop.auto_title}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleRestoreProperty(prop.id)}><RotateCcw className="mr-2 h-4 w-4" /> Restore</Button>
                          <PermanentDeleteDialog onConfirm={() => handlePermanentDeleteProperty(prop.id)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="buyers">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Buyers</CardTitle>
            </CardHeader>
            <CardContent>
               {deletedBuyers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No deleted buyers.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial No</TableHead>
                      <TableHead>Buyer Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedBuyers.map(buyer => (
                      <TableRow key={buyer.id}>
                        <TableCell><Badge variant="outline">{buyer.serial_no}</Badge></TableCell>
                        <TableCell>{buyer.name}</TableCell>
                        <TableCell>{buyer.phone}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleRestoreBuyer(buyer.id)}><RotateCcw className="mr-2 h-4 w-4" /> Restore</Button>
                          <PermanentDeleteDialog onConfirm={() => handlePermanentDeleteBuyer(buyer.id)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
