
import type { Property, User, Buyer, FollowUp, Appointment } from './types';

export const properties: Property[] = [
  {
    id: '1',
    serial_no: 'P-1250',
    auto_title: '5 Marla House in Harbanspura',
    owner_number: '+92 300 1234567',
    city: 'Lahore',
    area: 'Harbanspura',
    address: '123-B, Canal Road, Harbanspura, Lahore',
    property_type: 'House',
    size_value: 5,
    size_unit: 'Marla',
    demand_amount: 90,
    demand_unit: 'Lacs',
    status: 'Available',
    is_recorded: true,
    created_at: '2024-05-20T10:00:00Z',
    created_by: 'user_1',
  },
  {
    id: '2',
    serial_no: 'P-1251',
    auto_title: '10 Marla Plot in DHA Phase 6',
    owner_number: '+92 321 7654321',
    city: 'Lahore',
    area: 'DHA Phase 6',
    address: 'Plot 45, Sector D, DHA Phase 6, Lahore',
    property_type: 'Plot',
    size_value: 10,
    size_unit: 'Marla',
    demand_amount: 2.5,
    demand_unit: 'Crore',
    status: 'Available',
    is_recorded: false,
    created_at: '2024-05-19T14:30:00Z',
    created_by: 'user_2',
  },
  {
    id: '3',
    serial_no: 'P-1252',
    auto_title: '2 Bedroom Flat in Gulberg',
    owner_number: '+92 333 1122334',
    city: 'Lahore',
    area: 'Gulberg',
    address: 'Apt 5A, Paradise Heights, Gulberg III, Lahore',
    property_type: 'Flat',
    size_value: 1200,
    size_unit: 'SqFt',
    demand_amount: 1.2,
    demand_unit: 'Crore',
    status: 'Sold',
    is_recorded: true,
    created_at: '2024-05-18T11:00:00Z',
    created_by: 'user_1',
  },
  {
    id: '4',
    serial_no: 'P-1253',
    auto_title: '1 Kanal Commercial Plot in Johar Town',
    owner_number: '+92 312 9876543',
    city: 'Lahore',
    area: 'Johar Town',
    address: 'Commercial Plot 8, Block G, Johar Town, Lahore',
    property_type: 'Commercial',
    size_value: 1,
    size_unit: 'Kanal',
    demand_amount: 15,
    demand_unit: 'Crore',
    status: 'Reserved',
    is_recorded: false,
    created_at: '2024-05-17T09:00:00Z',
    created_by: 'user_3',
  },
  {
    id: '5',
    serial_no: 'P-1254',
    auto_title: '8 Marla House in Bahria Town',
    owner_number: '+92 345 5566778',
    city: 'Lahore',
    area: 'Bahria Town',
    address: 'House 786, Sector C, Bahria Town, Lahore',
    property_type: 'House',
    size_value: 8,
    size_unit: 'Marla',
    demand_amount: 1.8,
    demand_unit: 'Crore',
    status: 'Available',
    is_recorded: false,
    created_at: '2024-05-21T16:00:00Z',
    created_by: 'user_2',
  },
];


export const buyers: Buyer[] = [
    {
        id: '1',
        serial_no: 'B-820',
        name: 'Ahmed Hassan',
        phone: '+92 301 2345678',
        email: 'ahmed.hassan@example.com',
        area_preference: 'DHA, Gulberg',
        property_type_preference: 'House, Plot',
        status: 'Interested',
    },
    {
        id: '2',
        serial_no: 'B-821',
        name: 'Sana Iqbal',
        phone: '+92 322 8765432',
        email: 'sana.iqbal@example.com',
        area_preference: 'Bahria Town',
        property_type_preference: 'Flat',
        status: 'Contacted',
    },
    {
        id: '3',
        serial_no: 'B-822',
        name: 'Faisal Khan',
        phone: '+92 333 1122334',
        email: 'faisal.khan@example.com',
        area_preference: 'Johar Town',
        property_type_preference: 'Commercial',
        status: 'New',
    },
     {
        id: '4',
        serial_no: 'B-823',
        name: 'Ayesha Malik',
        phone: '+92 315 4455667',
        email: 'ayesha.malik@example.com',
        area_preference: 'Harbanspura',
        property_type_preference: 'House',
        status: 'Not Interested',
    }
];

export const teamMembers: User[] = [
    {
        id: '1',
        name: 'Demo Admin',
        email: 'admin@signaturecrm.test',
        role: 'Admin',
        avatar: '', // will be replaced by placeholder
    },
    {
        id: '2',
        name: 'Ali Khan',
        email: 'ali.khan@signaturecrm.test',
        role: 'Agent',
        avatar: '',
    },
    {
        id: '3',
        name: 'Fatima Ahmed',
        email: 'fatima.ahmed@signaturecrm.test',
        role: 'Agent',
        avatar: '',
    },
    {
        id: '4',
        name: 'Sana Javed',
        email: 'sana.javed@signaturecrm.test',
        role: 'Viewer',
        avatar: '',
    }
];

export const followUps: FollowUp[] = [
    {
        id: '1',
        buyerId: '2',
        buyerName: 'Sana Iqbal',
        propertyInterest: 'P-1252: 2 Bedroom Flat in Gulberg',
        lastContactDate: '2024-05-20T10:00:00Z',
        nextReminder: '2024-05-25T10:00:00Z',
        status: 'Scheduled',
        notes: 'Client asked for more pictures and a video tour. Sent them via WhatsApp. Will follow up on Saturday.'
    },
    {
        id: '2',
        buyerId: '1',
        buyerName: 'Ahmed Hassan',
        propertyInterest: 'P-1251: 10 Marla Plot in DHA Phase 6',
        lastContactDate: '2024-05-22T15:00:00Z',
        nextReminder: '2024-05-24T15:00:00Z',
        status: 'Due Soon',
        notes: 'Negotiating on price. Client is firm on 2.4 Crore. Need to discuss with the owner.'
    },
    {
        id: '3',
        buyerId: '4',
        buyerName: 'Ayesha Malik',
        propertyInterest: 'P-1250: 5 Marla House in Harbanspura',
        lastContactDate: '2024-05-19T12:00:00Z',
        nextReminder: '2024-05-22T12:00:00Z',
        status: 'Completed',
        notes: 'Followed up. Client is no longer interested as they found another property. Marked as Not Interested.'
    }
];

export const appointments: Appointment[] = [
    {
        id: '1',
        buyerName: 'Ahmed Hassan',
        agentName: 'Ali Khan',
        date: '2024-05-26T00:00:00.000Z',
        time: '11:00 AM',
        propertyAddress: 'Plot 45, Sector D, DHA Phase 6, Lahore',
        status: 'Scheduled'
    },
    {
        id: '2',
        buyerName: 'Sana Iqbal',
        agentName: 'Fatima Ahmed',
        date: '2024-05-25T00:00:00.000Z',
        time: '2:30 PM',
        propertyAddress: 'Apt 5A, Paradise Heights, Gulberg III, Lahore',
        status: 'Scheduled'
    },
    {
        id: '3',
        buyerName: 'Faisal Khan',
        agentName: 'Ali Khan',
        date: '2024-05-22T00:00:00.000Z',
        time: '4:00 PM',
        propertyAddress: 'Commercial Plot 8, Block G, Johar Town, Lahore',
        status: 'Completed'
    }
];
