import { Property } from "./types";

const API_KEY = process.env.GOOGLE_API_KEY;
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export async function fetchPropertiesFromSheets(): Promise<Property[] | null> {
  if (!API_KEY || !SHEETS_ID) return null;

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/A1:Z100?key=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      console.error("Sheets API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const rows: string[][] = data.values;
    if (!rows || rows.length < 2) return null;

    const headers = rows[0].map((h: string) => h.toLowerCase().trim());
    const col = (name: string) => {
      // Try exact match first, then partial match
      let idx = headers.indexOf(name);
      if (idx >= 0) return idx;
      idx = headers.findIndex((h) => h.includes(name));
      return idx;
    };

    const properties: Property[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const get = (colName: string, ...alternates: string[]) => {
        for (const name of [colName, ...alternates]) {
          const idx = col(name);
          if (idx >= 0 && row[idx]) return row[idx].toString().trim();
        }
        return "";
      };

      const name = get("name", "property name", "property");
      if (!name) continue;

      properties.push({
        name,
        location: get("location", "area"),
        category: get("category", "type"),
        lotSize: get("lot size", "lot size (m2)", "lot"),
        constructionSize: get("construction size", "construction size (m2)", "built area"),
        pricePerSqm: get("price per sqm", "price/m2"),
        price: get("price", "price (usd)"),
        bedrooms: get("bedrooms", "beds"),
        bathrooms: get("bathrooms", "baths"),
        parking: get("parking"),
        amenities: get("amenities"),
        ownerDeveloper: get("owner/developer", "developer", "owner"),
        ownerContact: get("owner contact", "contact"),
        driveFolderLink: get("drive folder link", "drive folder", "folder link"),
        status: get("status") || "Available",
        legalDocs: get("legal docs", "legal").toLowerCase() === "yes",
        notes: get("notes"),
        imageUrl: get("image url", "image") || "",
      });
    }

    return properties.length > 0 ? properties : null;
  } catch (error) {
    console.error("Failed to fetch from Google Sheets:", error);
    return null;
  }
}

export async function fetchDriveImages(propertyName: string): Promise<string[]> {
  if (!API_KEY || !DRIVE_FOLDER_ID) return [];

  try {
    // Search for a subfolder matching the property name
    const folderQuery = encodeURIComponent(
      `'${DRIVE_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and name contains '${propertyName.replace(/'/g, "\\'")}'`
    );
    const folderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=files(id,name)&key=${API_KEY}`
    );

    let targetFolderId = DRIVE_FOLDER_ID;
    if (folderRes.ok) {
      const folderData = await folderRes.json();
      if (folderData.files?.length > 0) {
        targetFolderId = folderData.files[0].id;
      }
    }

    // Get images from the folder
    const imageQuery = encodeURIComponent(
      `'${targetFolderId}' in parents and mimeType contains 'image/'`
    );
    const imagesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${imageQuery}&fields=files(id,name,mimeType,thumbnailLink)&orderBy=name&pageSize=10&key=${API_KEY}`
    );

    if (!imagesRes.ok) return [];

    const imagesData = await imagesRes.json();
    const images = imagesData.files || [];

    return images
      .map((f: { id?: string; thumbnailLink?: string }) => {
        if (f.id) return `https://drive.google.com/thumbnail?id=${f.id}&sz=w800`;
        return f.thumbnailLink || "";
      })
      .filter(Boolean);
  } catch (error) {
    console.error(`Failed to fetch Drive images for ${propertyName}:`, error);
    return [];
  }
}

export async function enrichPropertiesWithDriveImages(
  properties: Property[]
): Promise<Property[]> {
  if (!API_KEY || !DRIVE_FOLDER_ID) return properties;

  const enriched = await Promise.all(
    properties.map(async (p) => {
      // Skip if already has a non-placeholder image
      if (p.imageUrl && !p.imageUrl.includes("unsplash.com")) return p;

      const images = await fetchDriveImages(p.name);
      if (images.length > 0) {
        return { ...p, imageUrl: images[0] };
      }
      return p;
    })
  );

  return enriched;
}
