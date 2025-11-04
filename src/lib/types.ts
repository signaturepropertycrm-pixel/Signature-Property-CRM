export type UserRole = 'Admin' | 'Agent' | 'Viewer';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  permissions?: Record<string, boolean>;
};

export type PropertyType = 'House' | 'Plot' | 'Flat' | 'Shop' | 'Commercial' | 'Agricultural' | 'Other';
export type SizeUnit = 'Marla' | 'SqFt' | 'Kanal' | 'Acre' | 'Maraba';
export type PriceUnit = 'Thousand' | 'Lacs' | 'Crore';
export type PropertyStatus = 'Available' | 'Reserved' | 'Sold' | 'Off-Market';

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
  demand_amount: number;
  demand_unit: PriceUnit;
  status: PropertyStatus;
  is_recorded: boolean;
  created_at: string;
  created_by: string; // user id
};
