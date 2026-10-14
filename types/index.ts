export type RequestCategory = 'rescue' | 'medical' | 'water' | 'shelter' | 'food';

export type UrgencyLevel = 'critical' | 'high' | 'medium';

export type RequestStatus = 'open' | 'assigned' | 'fulfilled';

export type ProviderType = 'volunteer' | 'hub' | 'ngo';

export interface UrgencyBreakdown {
  categoryPts: number;
  peoplePts: number;
  vulnerablePts: number;
  waitingPts: number;
  total: number;
  explanation: string;
}

export interface ReliefRequest {
  id: string;
  category: RequestCategory;
  description: string;
  peopleAffected: number;
  vulnerable: boolean; // children/elderly/disabled
  urgency: UrgencyLevel;
  areaName: string;
  lat: number;
  lng: number;
  contactPhone: string;
  status: RequestStatus;
  createdAt: number; // timestamp in ms
  assignedSupplyId?: string;
  urgencyScore: number; // 0-100
  verified?: boolean;
  duplicateWarning?: boolean;
  updatedAt?: number;
}

export interface ReliefSupply {
  id: string;
  providerName: string;
  type: ProviderType;
  category: RequestCategory;
  item: string;
  quantity: number;
  areaName: string;
  lat: number;
  lng: number;
  contactPhone: string;
  available: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface MatchSuggestion {
  supply: ReliefSupply;
  distanceKm: number;
}

export interface DispatchKPIs {
  openCount: number;
  criticalCount: number;
  assignedCount: number;
  fulfilledCount: number;
  activeSuppliesCount: number;
  avgResponseMinutes: number;
}
