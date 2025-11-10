



export type UserRole = 'Admin' | 'Agent' | 'Editor';

export type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  permissions?: Record<string, boolean>;
  stats?: {
      propertiesSold: number;
      activeBuyers: number;
      appointmentsToday: number;
  }
};

export type PropertyType = 'House' | 'Plot' | 'Flat' | 'Shop' | 'Commercial' | 'Agricultural' | 'Other' | '';
export type SizeUnit = 'Marla' | 'SqFt' | 'Kanal' | 'Acre' | 'Maraba';
export type PriceUnit = 'Thousand' | 'Lacs' | 'Crore';
export type PropertyStatus = 'Available' | 'Sold';

export type Property = {
  id: string;
  serial_no: string;
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
  video_links?: {
    tiktok?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
    other?: string;
  };
  is_deleted?: boolean;
};

export type BuyerStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Not Interested'
  | 'Follow Up'
  | 'Pending Response'
  | 'Need More Info'
  | 'Visited Property'
  | 'Deal Closed'
  | 'Hot Lead'
  | 'Cold Lead';

export type Buyer = {
    id: string;
    serial_no: string;
    name: string;
    phone: string;
    email?: string;
    status: BuyerStatus;
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
    is_deleted?: boolean;
    last_follow_up_note?: string;
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
}
