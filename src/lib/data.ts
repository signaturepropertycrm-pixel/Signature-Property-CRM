
import type { Property, User, Buyer, FollowUp, Appointment, BuyerStatus, Activity } from './types';

export const properties: Property[] = [];

export const buyerStatuses: BuyerStatus[] = [
    'New', 'Contacted', 'Interested', 'Not Interested', 'Follow Up',
    'Pending Response', 'Need More Info', 'Visited Property',
    'Deal Closed', 'Hot Lead', 'Cold Lead'
];

export const buyers: Buyer[] = [];

export const teamMembers: User[] = [];

export const followUps: FollowUp[] = [];

export const appointments: Appointment[] = [];

export const activities: Activity[] = [];
