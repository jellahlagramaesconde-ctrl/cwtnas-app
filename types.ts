

export enum UserRole {
  RESIDENT = 'RESIDENT',
  ADMIN = 'ADMIN',
  GUEST = 'GUEST',
  DRIVER = 'DRIVER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  zone?: string; // For residents
  plateNumber?: string; // For drivers
  vehicleType?: string; // For drivers
}

export enum ReportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  DELAYED = 'DELAYED' // For waste collection
}

export enum PriorityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/* Define the missing Report interface */
export interface Report {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  priority: PriorityLevel;
  status: ReportStatus;
  dateReported: string;
  createdAt: any;
  reporterId: string;
  reporterName: string;
  imageUrl?: string | null;
}

export interface ReportMessage {
  id: string;
  text: string;
  senderName: string;
  senderRole: UserRole;
  timestamp: any; // Firestore timestamp
}

export interface RouteMessage {
  id: string;
  text: string;
  senderName: string;
  senderRole: UserRole;
  timestamp: any;
}

export interface WasteRoute {
  id: string;
  name: string;
  driver: string;
  truckId: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Delayed';
  progress: number; // 0 to 100
  zone: string;
  startTime?: string;
  currentLocation?: {
    lat: number; 
    lng: number;
  };
  description?: string; // Driver's status message or note
  adminMessage?: string; // Admin's message to driver (Latest alert)
}

export interface CollectionSchedule {
  day: string;
  zones: string[];
  time: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}

export interface SmartBin {
  id: string;
  type: 'Biodegradable' | 'Non-Biodegradable' | 'Recyclable';
  location: string;
  fillLevel: number; // 0 to 100 percentage
  daysSinceEmptied: number; // For duration tracking
  lastUpdated: string;
  status: 'Normal' | 'Full' | 'Critical';
}
