import { NextResponse } from "next/server";
import { fetchPropertiesFromSheets, enrichPropertiesWithDriveImages } from "@/lib/google";
import { PROPERTIES } from "@/lib/properties";
import { Property } from "@/lib/types";

let cachedProperties: Property[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = Date.now();

  if (cachedProperties && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ properties: cachedProperties, source: "cache" });
  }

  // Try Google Sheets first
  let properties = await fetchPropertiesFromSheets();
  let source = "sheets";

  if (!properties) {
    properties = PROPERTIES;
    source = "hardcoded";
  }

  // Enrich with Drive images
  properties = await enrichPropertiesWithDriveImages(properties);

  cachedProperties = properties;
  cacheTimestamp = now;

  return NextResponse.json({ properties, source });
}
