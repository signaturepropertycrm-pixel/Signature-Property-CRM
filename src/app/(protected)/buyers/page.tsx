
'use client';
import { AddBuyerDialog } from '@/components/add-buyer-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buyers } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Edit, MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const statusVariant = {
    'New': 'default',
    'Contacted': 'secondary',
    'Interested': 'outline',
    'Not Interested': 'destructive',
    'Closed': 'default'
} as const;

export default function BuyersPage() {
    const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Buyers</h1>
            <p className="text-muted-foreground">Manage your buyer leads.</p>
          </div>
           <Button onClick={() => setIsAddBuyerOpen(true)} className="glowing-btn">
              <PlusCircle />
              Add Buyer
            </Button>
        </div>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Serial No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Preferences</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {buyers.map(buyer => (
                            <TableRow key={buyer.id}>
                                <TableCell className="font-mono">{buyer.serial_no}</TableCell>
                                <TableCell className="font-medium">{buyer.name}</TableCell>
                                <TableCell>{buyer.phone}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span>{buyer.area_preference}</span>
                                        <span className="text-muted-foreground">{buyer.property_type_preference}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusVariant[buyer.status]}>{buyer.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost" className="rounded-full">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="glass-card">
                                        <DropdownMenuItem>
                                            <Edit />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                            <Trash2 />
                                            Delete
                                        </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-8 right-8 z-50">
         <AddBuyerDialog isOpen={isAddBuyerOpen} setIsOpen={setIsAddBuyerOpen} />
      </div>
    </>
  );
}
