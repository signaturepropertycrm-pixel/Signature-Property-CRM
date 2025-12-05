
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Check, X, Eye, Loader2 } from 'lucide-react';
import { useProfile } from '@/context/profile-context';
import { AppLoader } from '@/components/ui/loader';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import type { UpgradeRequest, PlanName } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
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


export default function SuperAdminPage() {
    const { profile, isLoading: isProfileLoading } = useProfile();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const upgradeRequestsQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'upgradeRequests'), where('status', '==', 'pending')) : null),
        [firestore]
    );

    const { data: requests, isLoading: isRequestsLoading } = useCollection<UpgradeRequest>(upgradeRequestsQuery);

    const handleUpdateRequest = async (request: UpgradeRequest, newStatus: 'approved' | 'rejected') => {
        if (!profile.user_id) return;
        setActionLoading(request.id);

        try {
            const batch = writeBatch(firestore);

            const requestRef = doc(firestore, 'upgradeRequests', request.id);
            batch.update(requestRef, { 
                status: newStatus,
                reviewedAt: new Date().toISOString(),
                reviewerId: profile.user_id,
             });

            if (newStatus === 'approved') {
                const agencyRef = doc(firestore, 'agencies', request.agencyId);
                batch.update(agencyRef, { planName: request.requestedPlan });
            }

            await batch.commit();
            toast({
                title: 'Request Updated',
                description: `Request for ${request.agencyName} has been ${newStatus}.`,
            });

        } catch (error) {
            console.error(`Error updating request:`, error);
            toast({
                title: 'Error',
                description: 'Could not update the request. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(null);
        }
    }

    if (isProfileLoading || isRequestsLoading) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <AppLoader />
            </div>
        )
    }

    if (profile.email !== 'usmansagheer444@gmail.com') {
        return (
            <div className="flex h-full items-center justify-center">
                 <Card className="max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>
                            You do not have permission to view this page.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <ShieldCheck />
          Super Admin Panel
        </h1>
        <p className="text-muted-foreground">
          Manage agencies and plan upgrade requests.
        </p>
      </div>
      
       <Card>
        <CardHeader>
            <CardTitle>Pending Upgrade Requests</CardTitle>
            <CardDescription>
                Review and approve or reject plan upgrade requests from agencies.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Agency Name</TableHead>
                        <TableHead>Requested Plan</TableHead>
                        <TableHead>Billing Cycle</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests && requests.length > 0 ? (
                        requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.agencyName}</TableCell>
                                <TableCell><Badge variant="secondary">{req.requestedPlan}</Badge></TableCell>
                                <TableCell className="capitalize">{req.billingCycle}</TableCell>
                                <TableCell>RS {req.amount.toLocaleString()}</TableCell>
                                <TableCell className="font-mono">{req.transactionId}</TableCell>
                                <TableCell>{format(new Date(req.createdAt.toDate()), 'PP')}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="icon" asChild>
                                        <Link href={req.receiptUrl} target="_blank"><Eye /></Link>
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" disabled={actionLoading === req.id}>
                                                {actionLoading === req.id && newStatus === 'rejected' ? <Loader2 className="animate-spin" /> : <X className="h-4 w-4" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Reject Request?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to reject this upgrade request from {req.agencyName}?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleUpdateRequest(req, 'rejected')}>Confirm Reject</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="default" size="icon" disabled={actionLoading === req.id} className="bg-green-600 hover:bg-green-700">
                                                {actionLoading === req.id && newStatus === 'approved' ? <Loader2 className="animate-spin" /> : <Check className="h-4 w-4" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Approve Request?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to approve this upgrade request from {req.agencyName} to the {req.requestedPlan} plan?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleUpdateRequest(req, 'approved')}>Confirm Approve</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center h-24">No pending requests.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
