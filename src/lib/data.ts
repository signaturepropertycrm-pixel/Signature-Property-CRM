
import type { Property, User, Buyer, FollowUp, Appointment, BuyerStatus, Activity } from './types';

export const properties: Property[] = [];

export const buyerStatuses: BuyerStatus[] = [
    'New', 'Interested', 'Not Interested', 'Follow Up',
    'Visited Property', 'Deal Closed'
];

export const buyers: Buyer[] = [];

export const teamMembers: User[] = [];

export const followUps: FollowUp[] = [];

export const appointments: Appointment[] = [];

export const activities: Activity[] = [];
