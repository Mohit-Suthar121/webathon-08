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
  credibilityScore?: number; // 0-100
  credibilityReasons?: string[];
  isAiAssisted?: boolean;
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
  lastSeen?: number; // heartbeat timestamp
  updatedAt?: number;
}

export interface MatchSuggestion {
  supply: ReliefSupply;
  distanceKm: number;
  score?: number;
  competingDemand?: number; // number of open requests needing this same supply
  explanation?: string;
  isAiAssisted?: boolean;
}

export interface DispatchKPIs {
  openCount: number;
  criticalCount: number;
  assignedCount: number;
  fulfilledCount: number;
  activeSuppliesCount: number;
  avgResponseMinutes: number;
}

export interface HubHeartbeat {
  hubId: string;
  hubName: string;
  areaName: string;
  lat: number;
  lng: number;
  lastSeen: number;
}

export interface BlackoutAlert {
  id: string;
  wardName: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  lastSignalAgoMinutes: number;
  missedPings?: number;
  severity: 'possible';
  detectedAt: number;
  reason: string;
}

export interface FloodRiskZone {
  wardName: string;
  lat: number;
  lng: number;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  rainfallMm: number;
  riverProximityKm: number;
  elevationMeters: number;
  soilSaturationIndex: number;
  factors: string[];
}

export interface FloodAdvisory {
  city: string;
  overallRisk: number;
  advisory: string;
  prePositionAdvice: string[];
  weatherSummary: {
    currentRainMm: number;
    forecast24hMm: number;
    riverDischargeEstimate: string;
  };
  dataSource: string;
  isAiAssisted: boolean;
  wardRisks: FloodRiskZone[];
}
