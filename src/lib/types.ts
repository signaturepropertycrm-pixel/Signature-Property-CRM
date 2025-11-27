

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
export type CommissionUnit = 'PKR' | '%';
export type PropertyStatus = 'Available' | 'Sold';
export type ListingType = 'For Sale' | 'For Rent';

export type Property = {
  id: string;
  serial_no: string;
  listing_type: ListingType;
  auto_title: string;
  owner_number: string;
  city: string;
  area: string;
  address: string;
  property_type: PropertyType;
  size_value: number;
  size_unit: SizeUnit;
  road_size_ft?: number;
  storey?: string;
  is_for_rent?: boolean;
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
  demand_unit: 'Lacs' | 'Crore';
  documents?: string;
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
  commission_from_buyer_unit?: CommissionUnit;
  commission_from_seller?: number;
  commission_from_seller_unit?: CommissionUnit;
  total_commission?: number;
  agent_share_percentage?: number;
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
    name: string;
    phone: string;
    email?: string;
    status: BuyerStatus;
    is_investor?: boolean;
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

export type FollowUpStatus = 'Scheduled';

export type FollowUp = {
    id: string;
    buyerId: string;
    buyerName: string;
    buyerPhone?: string;
    propertyInterest: string;
    lastContactDate: string;
    nextReminder: string;
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
    targetType: 'Property' | 'Buyer' | 'Appointment' | 'User';
    details?: any;
    timestamp: string;
    agency_id: string;
};
