


import type { Property, User, Buyer, FollowUp, Appointment, BuyerStatus } from './types';

export const properties: Property[] = [
  {
    id: '1',
    serial_no: 'P-1',
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
    video_links: {
      tiktok: 'https://www.tiktok.com/@laibak522/video/7560351668261408008',
      youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      other: 'https://example.com'
    }
  },
  {
    id: '2',
    serial_no: 'P-2',
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
    serial_no: 'P-3',
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
    serial_no: 'P-4',
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
    status: 'Available',
    is_recorded: false,
    created_at: '2024-05-17T09:00:00Z',
    created_by: 'user_3',
  },
  {
    id: '5',
    serial_no: 'P-5',
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


export const buyerStatuses: BuyerStatus[] = [
    'New', 'Contacted', 'Interested', 'Not Interested', 'Follow Up',
    'Pending Response', 'Need More Info', 'Visited Property',
    'Deal Closed', 'Hot Lead', 'Cold Lead'
];


export const buyers: Buyer[] = [
    {
        id: '1',
        serial_no: 'B-1',
        name: 'Ahmed Hassan',
        phone: '+92 301 2345678',
        area_preference: 'DHA, Gulberg',
        property_type_preference: 'House',
        status: 'Hot Lead',
        budget_min_amount: 2,
        budget_min_unit: 'Crore',
        budget_max_amount: 2.5,
        budget_max_unit: 'Crore',
        created_at: '2024-07-20T10:00:00Z',
        size_min_value: 8,
        size_min_unit: 'Marla',
        size_max_value: 10,
        size_max_unit: 'Marla',
    },
    {
        id: '2',
        serial_no: 'B-2',
        name: 'Sana Iqbal',
        phone: '+92 322 8765432',
        area_preference: 'Bahria Town',
        property_type_preference: 'Flat',
        status: 'Follow Up',
        budget_min_amount: 90,
        budget_min_unit: 'Lacs',
        budget_max_amount: 1.2,
        budget_max_unit: 'Crore',
        created_at: '2024-07-19T14:30:00Z'
    },
    {
        id: '3',
        serial_no: 'B-3',
        name: 'Faisal Khan',
        phone: '+92 333 1122334',
        area_preference: 'Johar Town',
        property_type_preference: 'Commercial',
        status: 'New',
        budget_min_amount: 10,
        budget_min_unit: 'Crore',
        budget_max_amount: 15,
        budget_max_unit: 'Crore',
        created_at: '2024-07-18T11:00:00Z'
    },
     {
        id: '4',
        serial_no: 'B-4',
        name: 'Ayesha Malik',
        phone: '+92 315 4455667',
        area_preference: 'Harbanspura',
        property_type_preference: 'House',
        status: 'Not Interested',
        budget_min_amount: 70,
        budget_min_unit: 'Lacs',
        budget_max_amount: 90,
        budget_max_unit: 'Lacs',
        created_at: '2024-07-17T09:00:00Z'
    }
];

export const teamMembers: User[] = [
    {
        id: '1',
        name: 'Demo Admin',
        email: 'admin@signaturecrm.test',
        phone: '+92 300 1112233',
        role: 'Admin',
        avatar: '', // will be replaced by placeholder
        stats: {
            propertiesSold: 5,
            activeBuyers: 12,
            appointmentsToday: 2,
        }
    },
    {
        id: '2',
        name: 'Ali Khan',
        email: 'ali.khan@signaturecrm.test',
        phone: '+92 321 4455667',
        role: 'Agent',
        avatar: '',
        stats: {
            propertiesSold: 8,
            activeBuyers: 25,
            appointmentsToday: 5,
        }
    },
    {
        id: '3',
        name: 'Fatima Ahmed',
        email: 'fatima.ahmed@signaturecrm.test',
        phone: '+92 333 7788990',
        role: 'Agent',
        avatar: '',
        stats: {
            propertiesSold: 12,
            activeBuyers: 18,
            appointmentsToday: 3,
        }
    },
    {
        id: '4',
        name: 'Sana Javed',
        role: 'Viewer',
        avatar: '',
    }
];

export const followUps: FollowUp[] = [
    {
        id: '1',
        buyerId: '2',
        buyerName: 'Sana Iqbal',
        buyerPhone: '+92 322 8765432',
        propertyInterest: 'P-3: 2 Bedroom Flat in Gulberg',
        lastContactDate: '2024-05-20T10:00:00Z',
        nextReminder: '2024-05-25T10:00:00Z',
        status: 'Scheduled',
        notes: 'Client asked for more pictures and a video tour. Sent them via WhatsApp. Will follow up on Saturday.'
    },
    {
        id: '2',
        buyerId: '1',
        buyerName: 'Ahmed Hassan',
        buyerPhone: '+92 301 2345678',
        propertyInterest: 'P-2: 10 Marla Plot in DHA Phase 6',
        lastContactDate: '2024-05-22T15:00:00Z',
        nextReminder: '2024-05-24T15:00:00Z',
        status: 'Scheduled',
        notes: 'Negotiating on price. Client is firm on 2.4 Crore. Need to discuss with the owner.'
    }
];

const now = new Date();
const lastMonth = new Date();
lastMonth.setMonth(now.getMonth() - 1);

export const appointments: Appointment[] = [
    {
        id: '1',
        contactName: 'Ahmed Hassan',
        contactSerialNo: 'B-1',
        contactType: 'Buyer',
        agentName: 'Ali Khan',
        date: new Date().toISOString(),
        time: '11:00',
        message: 'Meeting at property location: Plot 45, Sector D, DHA Phase 6, Lahore',
        status: 'Scheduled'
    },
    {
        id: '2',
        contactName: 'Sana Iqbal',
        contactSerialNo: 'B-2',
        contactType: 'Buyer',
        agentName: 'Fatima Ahmed',
        date: new Date(new Date().setDate(now.getDate() + 2)).toISOString(),
        time: '14:30',
        message: 'Client will visit the office to discuss flat options.',
        status: 'Scheduled'
    },
    {
        id: '3',
        contactName: 'Owner of P-4',
        contactSerialNo: 'P-4',
        contactType: 'Owner',
        agentName: 'Demo Admin',
        date: new Date(new Date().setDate(now.getDate() - 2)).toISOString(),
        time: '16:00',
        message: 'Discussing final offer for the commercial plot in Johar Town.',
        status: 'Completed',
        notes: 'Deal finalized. Paperwork to be started.'
    },
    {
        id: '4',
        contactName: 'Faisal Khan',
        contactSerialNo: 'B-3',
        contactType: 'Buyer',
        agentName: 'Ali Khan',
        date: new Date(new Date().setDate(now.getDate() - 5)).toISOString(),
        time: '10:00',
        message: 'Initial call to discuss commercial options.',
        status: 'Completed',
        notes: 'Client is interested in plots around Johar Town.'
    },
    {
        id: '5',
        contactName: 'Owner of P-1',
        contactSerialNo: 'P-1',
        contactType: 'Owner',
        agentName: 'Fatima Ahmed',
        date: new Date(new Date().setDate(now.getDate() - 3)).toISOString(),
        time: '12:00',
        message: 'Scheduled visit, but owner had to cancel.',
        status: 'Cancelled',
        notes: 'Family emergency. Will reschedule next week.'
    }
];
