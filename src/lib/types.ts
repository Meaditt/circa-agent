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
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
