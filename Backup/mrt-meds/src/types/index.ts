export interface Medicine {
  id: string;
  name: string;
  strength: string;
  form: MedicineForm;
  route: MedicineRoute;
  storageRequirements?: string;
  isControlled: boolean;
  minStock: number;
  maxStock: number;
  category: MedicineCategory;
  notes?: string;
  expirationDate?: Date;
}

export interface Batch {
  id: string;
  medicineId: string;
  lotNumber: string;
  expiryDate: Date;
  manufacturer: string;
  receivedDate: Date;
  quantity: number;
  supplierName?: string;
  invoiceNumber?: string;
}

export interface Item {
  id: string;
  batchId: string;
  medicineId: string;
  locationId: string;
  status: ItemStatus;
  addedDate: Date;
  lastCheckedDate?: Date;
  notes?: string;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  parentId?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Movement {
  id: string;
  itemId: string;
  medicineId: string;
  batchId: string;
  action: MovementAction;
  fromLocationId?: string;
  toLocationId?: string;
  performedBy: string;
  witnessedBy?: string;
  patientDetails?: PatientDetails;
  timestamp: Date;
  quantity: number;
  notes?: string;
}

export interface PatientDetails {
  id?: string;
  incidentNumber?: string;
  patientName?: string;
  ageGroup?: AgeGroup;
  weight?: number;
  allergies?: string;
  dose?: string;
  route?: string;
  time?: Date;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  isActive: boolean;
}

export interface ExpiryStatus {
  status: 'expired' | 'critical' | 'warning' | 'ok';
  daysUntilExpiry: number;
  expiryDate: Date;
}

export interface StockLevel {
  medicineId: string;
  medicineName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  status: 'critical' | 'low' | 'ok' | 'excess';
  percentage: number;
}

export interface KitCheck {
  id: string;
  locationId: string;
  checkedBy: string;
  checkedDate: Date;
  itemsChecked: number;
  issues: KitIssue[];
  nextDueDate: Date;
  status: 'complete' | 'partial' | 'overdue';
}

export interface KitIssue {
  itemId: string;
  issueType: 'expired' | 'missing' | 'damaged' | 'low_stock';
  description: string;
  resolved: boolean;
  resolvedDate?: Date;
  resolvedBy?: string;
}

export type MedicineForm = 
  | 'tablet'
  | 'capsule'
  | 'injection'
  | 'ampoule'
  | 'vial'
  | 'nebule'
  | 'inhaler'
  | 'spray'
  | 'gel'
  | 'cream'
  | 'liquid'
  | 'suspension'
  | 'suppository'
  | 'patch'
  | 'mask'
  | 'cylinder'
  | 'device'
  | 'consumable'
  | 'battery'
  | 'electrode'
  | 'airway'
  | 'dressing'
  | 'equipment';

export type MedicineRoute = 
  | 'oral'
  | 'sublingual'
  | 'buccal'
  | 'intramuscular'
  | 'intravenous'
  | 'subcutaneous'
  | 'intraosseous'
  | 'rectal'
  | 'nebulised'
  | 'inhaled'
  | 'nasal'
  | 'topical'
  | 'transdermal';

export type MedicineCategory = 
  | 'analgesic'
  | 'antibiotic'
  | 'antiemetic'
  | 'antihistamine'
  | 'cardiac'
  | 'respiratory'
  | 'sedative'
  | 'emergency'
  | 'controlled'
  | 'fluid'
  | 'equipment'
  | 'consumable'
  | 'airway'
  | 'trauma'
  | 'other';

export type LocationType = 
  | 'base'
  | 'vehicle'
  | 'kit'
  | 'pouch'
  | 'cabinet'
  | 'fridge'
  | 'storage';

export type ItemStatus = 
  | 'available'
  | 'administered'
  | 'disposed'
  | 'transferred'
  | 'damaged'
  | 'quarantine';

export type MovementAction = 
  | 'receive'
  | 'administer'
  | 'transfer'
  | 'dispose'
  | 'adjust'
  | 'check'
  | 'return';

export type UserRole = 
  | 'admin'
  | 'medic'
  | 'paramedic'
  | 'doctor'
  | 'stores'
  | 'viewer';

export type AgeGroup = 
  | 'neonate'
  | 'infant'
  | 'child'
  | 'adolescent'
  | 'adult'
  | 'elderly';

export interface AppSettings {
  expiryWarningDays: number;
  expiryCriticalDays: number;
  lowStockPercentage: number;
  criticalStockPercentage: number;
  kitCheckIntervalDays: number;
  temperatureUnit: 'celsius' | 'fahrenheit';
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}