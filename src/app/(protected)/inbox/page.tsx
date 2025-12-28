
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useProfile } from '@/context/profile-context';
import { useMemoFirebase } from '@/firebase/hooks';
import type { InboxMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Mail, AlertTriangle, Banknote, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const MessageItem = ({ message, isDemo = false }: { message: InboxMessage, isDemo?: boolean }) => {
    const router = useRouter();
    const firestore = useFirestore();
    const { profile } = useProfile();
    
    const handleGoToProperty = () => {
        if (isDemo) return;
        router.push(`/properties?status=All (Sale)&search=${message.propertySerial}`);
    }

    const handleMarkAsRead = async () => {
        if (isDemo || !message.isRead && profile.agency_id) {
            const messageRef = doc(firestore, 'agencies', profile.agency_id, 'inboxMessages', message.id);
            await updateDoc(messageRef, { isRead: true });
        }
    }

    const getIcon = () => {
        switch(message.type) {
            case 'cannot_record':
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'payment_confirmation':
                return <Banknote className="h-5 w-5 text-green-500" />;
            default:
                return <Mail className="h-5 w-5 text-muted-foreground" />;
        }
    }

    return (
        <div className={cn("flex items-start gap-4 p-4 border-b transition-colors", !message.isRead && "bg-primary/5", isDemo && "opacity-50 pointer-events-none")}>
            <div className="flex-shrink-0 pt-1">
                {getIcon()}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{message.fromUserName}</p>
                        <p className="text-sm text-muted-foreground">{message.message}</p>
                    </div>
                     <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</p>
                </div>
                <div className="flex justify-end items-center mt-2 gap-2">
                     <Button variant="link" size="sm" className="h-auto p-0" onClick={handleGoToProperty}>View Property</Button>
                     {!message.isRead && (
                         <Button variant="outline" size="sm" className="h-auto px-2 py-1" onClick={handleMarkAsRead}>
                            <Check className="mr-1 h-3 w-3" /> Mark as Read
                         </Button>
                     )}
                </div>
            </div>
        </div>
    );
};


export default function InboxPage() {
    const { profile } = useProfile();
    const firestore = useFirestore();

    const inboxQuery = useMemoFirebase(
        () => profile.agency_id 
            ? query(collection(firestore, 'agencies', profile.agency_id, 'inboxMessages'), orderBy('createdAt', 'desc')) 
            : null,
        [profile.agency_id, firestore]
    );
    const { data: messages, isLoading } = useCollection<InboxMessage>(inboxQuery);
    
    const cannotRecordMessages = useMemo(() => messages?.filter(m => m.type === 'cannot_record') || [], [messages]);
    const paymentMessages = useMemo(() => messages?.filter(m => m.type === 'payment_confirmation') || [], [messages]);

    const demoCannotRecordMessage: InboxMessage = {
        id: 'demo-cr-1',
        type: 'cannot_record',
        fromUserId: 'demo-user',
        fromUserName: 'Zeeshan (Demo)',
        message: 'Owner was not available at the location for video recording.',
        propertyId: 'demo-prop-1',
        propertySerial: 'P-123',
        isRead: true,
        createdAt: new Date().toISOString(),
        agency_id: profile.agency_id,
    };

    const demoPaymentMessage: InboxMessage = {
        id: 'demo-pm-1',
        type: 'payment_confirmation',
        fromUserId: 'demo-user',
        fromUserName: 'Zeeshan (Demo)',
        message: 'Cash payment of PKR 500 received for property P-124.',
        propertyId: 'demo-prop-2',
        propertySerial: 'P-124',
        isRead: true,
        createdAt: new Date().toISOString(),
        agency_id: profile.agency_id,
    };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                    <Mail/> Inbox
                </h1>
                <p className="text-muted-foreground">
                    Internal notifications and messages from your team.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Team Notifications</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="cannot_record">
                        <TabsList className="px-6 border-b w-full justify-start rounded-none">
                            <TabsTrigger value="cannot_record">Cannot Record ({cannotRecordMessages.filter(m => !m.isRead).length})</TabsTrigger>
                            <TabsTrigger value="payments">Payments ({paymentMessages.filter(m => !m.isRead).length})</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="cannot_record">
                            {isLoading ? <p className="p-6 text-muted-foreground">Loading messages...</p> : 
                             cannotRecordMessages.length > 0 ? (
                                cannotRecordMessages.map(msg => <MessageItem key={msg.id} message={msg} />)
                             ) : (
                                <div>
                                    <MessageItem message={demoCannotRecordMessage} isDemo={true} />
                                    <p className="p-4 text-center text-sm text-muted-foreground">No "Cannot Record" notifications found.</p>
                                </div>
                             )
                            }
                        </TabsContent>
                        
                        <TabsContent value="payments">
                           {isLoading ? <p className="p-6 text-muted-foreground">Loading messages...</p> : 
                             paymentMessages.length > 0 ? (
                                paymentMessages.map(msg => <MessageItem key={msg.id} message={msg} />)
                             ) : (
                                 <div>
                                    <MessageItem message={demoPaymentMessage} isDemo={true} />
                                    <p className="p-4 text-center text-sm text-muted-foreground">No payment confirmation notifications found.</p>
                                </div>
                             )
                            }
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
