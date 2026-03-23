export interface UnitType {
  name: string;
  bedrooms: number;
  bathrooms: number;
  indoorSqm: number;
  outdoorSqm: number;
  priceFrom?: number;
  priceTo?: number;
}

export interface RentalProjection {
  unitType: string;
  occupancyRate: string;
  nightlyRate: number;
  monthlyRent: number;
}

export interface Property {
  name: string;
  location: string;
  category: string;
  lotSize: string;
  constructionSize: string;
  pricePerSqm: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  amenities: string;
  ownerDeveloper: string;
  ownerContact: string;
  driveFolderLink: string;
  status: string;
  legalDocs: boolean;
  notes: string;
  imageUrl: string;
  // Extended fields for projects/developments
  totalUnits?: number;
  landSize?: string;
  unitTypes?: UnitType[];
  rentalProjections?: RentalProjection[];
  roiEstimate?: string;
  marketPricePerSqm?: string;
  entryPricePerSqm?: string;
  ecoFeatures?: string[];
  communityFeatures?: string[];
  description?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
