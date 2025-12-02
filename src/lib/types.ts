
export type UserRole = 'Admin' | 'Agent';

export type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  agency_id: string; // The ID of the agency admin user
  permissions?: Record<string, boolean>;
  stats?: {
      propertiesSold: number;
      activeBuyers: number;
      appointmentsToday: number;
  },
  status?: 'Pending' | 'Active'; // New status for invitations
  invitedAt?: any; // Timestamp for pending invites
};

export type PropertyType = 'House' | 'Plot' | 'Flat' | 'Shop' | 'Commercial' | 'Agricultural' | 'Other' | '';
export type SizeUnit = 'Marla' | 'SqFt' | 'Kanal' | 'Acre' | 'Maraba';
export type PriceUnit = 'Thousand' | 'Lacs' | 'Crore';
export type PropertyStatus = 'Available' | 'Sold' | 'Rent Out';
export type ListingType = 'For Sale' | 'For Rent';

export type Property = {
  id: string;
  serial_no: string;
  listing_type: ListingType;
  auto_title: string;
  country_code: string;
  owner_number: string;
  city: string;
  area: string;
  address: string;
  property_type: PropertyType;
  size_value: number;
  size_unit: SizeUnit;
  road_size_ft?: number;
  storey?: string;
  is_for_rent: boolean;
  meters?: {
    electricity: boolean;
    gas: boolean;
    water: boolean;
  };
  potential_rent_amount?: number;
  potential_rent_unit?: PriceUnit;
  front_ft?: number;
  length_ft?: number;
  demand_amount: number;
  demand_unit: 'Lacs' | 'Crore' | 'Thousand';
  documents?: string;
  message?: string; // New field for rent properties
  status: PropertyStatus;
  is_recorded: boolean;
  created_at: string;
  created_by: string; // user id
  agency_id: string;
  video_links?: {
    tiktok?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
    other?: string;
  };
  is_deleted?: boolean;
  assignedTo?: string | null; // ID of the agent assigned to this property
  // Sale details
  sold_price?: number;
  sold_price_unit?: PriceUnit;
  sale_date?: string;
  sold_by_agent_id?: string;
  commission_from_buyer?: number;
  commission_from_buyer_unit?: PriceUnit;
  commission_from_seller?: number;
  commission_from_seller_unit?: PriceUnit;
  total_commission?: number;
  agent_commission_amount?: number;
  agent_commission_unit?: PriceUnit;
  agent_share_percentage?: number;

  // Rent out details
  rent_out_date?: string;
  rented_by_agent_id?: string;
  rent_commission_from_tenant?: number;
  rent_commission_from_owner?: number;
  rent_total_commission?: number;
  rent_agent_share?: number;
};

export type BuyerStatus =
  | 'New'
  | 'Interested'
  | 'Not Interested'
  | 'Follow Up'
  | 'Visited Property'
  | 'Deal Closed';


export type Buyer = {
    id: string;
    serial_no: string;
    listing_type: ListingType;
    name: string;
    country_code: string;
    phone: string;
    email?: string;
    status: BuyerStatus;
    is_investor?: boolean;
    city?: string;
    area_preference?: string;
    property_type_preference?: PropertyType;
    budget_min_amount?: number;
    budget_min_unit?: PriceUnit;
    budget_max_amount?: number;
    budget_max_unit?: PriceUnit;
    size_min_value?: number;
    size_min_unit?: SizeUnit;
    size_max_value?: number;
    size_max_unit?: SizeUnit;
    notes?: string;
    created_at: string;
    created_by: string;
    agency_id: string;
    is_deleted?: boolean;
    last_follow_up_note?: string;
    assignedTo?: string | null; // ID of the agent assigned to this buyer
};

export type FollowUpStatus = 'Scheduled' | 'Completed';

export type FollowUp = {
    id: string;
    buyerId: string;
    buyerName: string;
    buyerPhone?: string;
    propertyInterest: string;
    lastContactDate: string;
    lastContactTime?: string;
    nextReminderDate: string;
    nextReminderTime: string;
    status: FollowUpStatus;
    notes: string;
    agency_id: string;
};

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled';
export type AppointmentContactType = 'Buyer' | 'Owner';


export type Appointment = {
    id: string;
    contactName: string;
    contactSerialNo?: string;
    contactType: AppointmentContactType;
    agentName: string;
    date: string;
    time: string;
    message: string;
    status: AppointmentStatus;
    notes?: string;
    agency_id: string;
}

export type Activity = {
    id: string;
    userName: string;
    userAvatar?: string;
    action: string;
    target: string;
    targetType: 'Property' | 'Buyer' | 'Appointment' | 'User' | 'FollowUp';
    details: { from: string; to: string } | null;
    timestamp: string;
    agency_id: string;
};

export type NotificationType = 'invitation' | 'appointment' | 'followup' | 'activity';

export interface BaseNotification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    timestamp: Date;
    isRead: boolean;
    isDeleted?: boolean;
}

export interface InvitationNotification extends BaseNotification {
    type: 'invitation';
    agencyId: string;
    agencyName: string;
    role: UserRole;
    email: string;
}

export interface AppointmentNotification extends BaseNotification {
    type: 'appointment';
    appointment: Appointment;
    reminderType: 'day' | 'hour' | 'minute';
}

export interface FollowUpNotification extends BaseNotification {
    type: 'followup';
    followUp: FollowUp;
    reminderType: 'day' | 'hour' | 'minute';
}

export interface ActivityNotification extends BaseNotification {
    type: 'activity';
    activity: Activity;
}

export type Notification = InvitationNotification | AppointmentNotification | FollowUpNotification | ActivityNotification;
