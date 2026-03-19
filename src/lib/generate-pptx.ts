import PptxGenJS from "pptxgenjs";
import { Property } from "./types";

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function generatePresentation(
  properties: Property[],
  customerName: string
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Circa Panama";
  pptx.subject = `Property Presentation for ${customerName}`;

  // Pre-fetch all images
  const imageMap = new Map<string, string>();
  await Promise.all(
    properties.map(async (p) => {
      if (p.imageUrl) {
        const data = await fetchImageAsBase64(p.imageUrl);
        if (data) imageMap.set(p.name, data);
      }
    })
  );

  // -- Title Slide --
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "1A1A2E" };

  titleSlide.addText("CIRCA", {
    x: 0.5,
    y: 1.5,
    w: "90%",
    fontSize: 60,
    fontFace: "Arial",
    color: "C8A96E",
    bold: true,
    align: "center",
  });

  titleSlide.addText("PANAMA REAL ESTATE", {
    x: 0.5,
    y: 2.8,
    w: "90%",
    fontSize: 24,
    fontFace: "Arial",
    color: "FFFFFF",
    align: "center",
  });

  titleSlide.addText(`Prepared for ${customerName}`, {
    x: 0.5,
    y: 4.0,
    w: "90%",
    fontSize: 16,
    fontFace: "Arial",
    color: "888888",
    align: "center",
  });

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  titleSlide.addText(date, {
    x: 0.5,
    y: 4.6,
    w: "90%",
    fontSize: 12,
    fontFace: "Arial",
    color: "666666",
    align: "center",
  });

  // -- Overview Slide --
  const overviewSlide = pptx.addSlide();
  overviewSlide.background = { color: "0F0F1A" };

  overviewSlide.addText("Selected Properties", {
    x: 0.5,
    y: 0.3,
    w: "90%",
    fontSize: 32,
    fontFace: "Arial",
    color: "C8A96E",
    bold: true,
  });

  overviewSlide.addText(
    `We've selected ${properties.length} properties that match your requirements.`,
    {
      x: 0.5,
      y: 1.2,
      w: "90%",
      fontSize: 16,
      fontFace: "Arial",
      color: "CCCCCC",
    }
  );

  const tableRows: PptxGenJS.TableRow[] = [
    [
      { text: "Property", options: { bold: true, color: "C8A96E", fill: { color: "1A1A2E" } } },
      { text: "Location", options: { bold: true, color: "C8A96E", fill: { color: "1A1A2E" } } },
      { text: "Type", options: { bold: true, color: "C8A96E", fill: { color: "1A1A2E" } } },
      { text: "Price", options: { bold: true, color: "C8A96E", fill: { color: "1A1A2E" } } },
      { text: "Beds", options: { bold: true, color: "C8A96E", fill: { color: "1A1A2E" } } },
    ],
  ];

  for (const p of properties) {
    tableRows.push([
      { text: p.name, options: { color: "FFFFFF", fill: { color: "16162B" } } },
      { text: p.location, options: { color: "CCCCCC", fill: { color: "16162B" } } },
      { text: p.category, options: { color: "CCCCCC", fill: { color: "16162B" } } },
      { text: p.price ? `$${p.price}` : "TBD", options: { color: "CCCCCC", fill: { color: "16162B" } } },
      { text: p.bedrooms || "-", options: { color: "CCCCCC", fill: { color: "16162B" } } },
    ]);
  }

  overviewSlide.addTable(tableRows, {
    x: 0.5,
    y: 2.0,
    w: 12,
    fontSize: 12,
    fontFace: "Arial",
    border: { type: "solid", pt: 0.5, color: "333333" },
  });

  // -- Individual Property Slides --
  for (const property of properties) {
    const slide = pptx.addSlide();
    slide.background = { color: "0F0F1A" };

    const imageData = imageMap.get(property.name);
    const hasImage = !!imageData;

    // Property image - right side
    if (hasImage) {
      slide.addImage({
        data: imageData,
        x: 6.2,
        y: 0.3,
        w: 6.5,
        h: 4.2,
        rounding: true,
      });
    }

    // Property name
    slide.addText(property.name, {
      x: 0.5,
      y: 0.3,
      w: hasImage ? 5.5 : "60%",
      fontSize: 32,
      fontFace: "Arial",
      color: "C8A96E",
      bold: true,
    });

    // Location + category
    slide.addText(`${property.location}  |  ${property.category}`, {
      x: 0.5,
      y: 1.2,
      w: hasImage ? 5.5 : "60%",
      fontSize: 14,
      fontFace: "Arial",
      color: "AAAAAA",
    });

    // Details grid
    const details: Array<[string, string]> = [];
    if (property.price) details.push(["Price", `$${property.price}`]);
    if (property.lotSize) details.push(["Lot Size", `${property.lotSize} m\u00B2`]);
    if (property.constructionSize) details.push(["Built Area", `${property.constructionSize} m\u00B2`]);
    if (property.bedrooms) details.push(["Bedrooms", property.bedrooms]);
    if (property.bathrooms) details.push(["Bathrooms", property.bathrooms]);
    if (property.parking) details.push(["Parking", property.parking]);
    if (property.status) details.push(["Status", property.status]);

    let yPos = 1.9;
    for (const [label, value] of details) {
      slide.addText(label, {
        x: 0.5,
        y: yPos,
        w: 2,
        fontSize: 12,
        fontFace: "Arial",
        color: "888888",
      });
      slide.addText(value, {
        x: 2.5,
        y: yPos,
        w: 3,
        fontSize: 14,
        fontFace: "Arial",
        color: "FFFFFF",
        bold: true,
      });
      yPos += 0.45;
    }

    // Amenities - below details on left side
    if (property.amenities) {
      yPos += 0.2;
      slide.addText("Amenities", {
        x: 0.5,
        y: yPos,
        w: 5,
        fontSize: 14,
        fontFace: "Arial",
        color: "C8A96E",
        bold: true,
      });

      yPos += 0.5;
      const amenityList = property.amenities.split(",").map((a) => a.trim());
      for (const amenity of amenityList) {
        slide.addText(`- ${amenity}`, {
          x: 0.5,
          y: yPos,
          w: 5,
          fontSize: 12,
          fontFace: "Arial",
          color: "CCCCCC",
        });
        yPos += 0.35;
      }
    }

    // Notes at bottom
    if (property.notes) {
      slide.addText(property.notes, {
        x: 0.5,
        y: 6.2,
        w: "90%",
        fontSize: 12,
        fontFace: "Arial",
        color: "999999",
        italic: true,
      });
    }

    // Developer info
    if (property.ownerDeveloper) {
      slide.addText(`Developer: ${property.ownerDeveloper}`, {
        x: 0.5,
        y: 6.7,
        w: "90%",
        fontSize: 10,
        fontFace: "Arial",
        color: "666666",
      });
    }
  }

  // -- Contact Slide --
  const contactSlide = pptx.addSlide();
  contactSlide.background = { color: "1A1A2E" };

  contactSlide.addText("Let's Find Your Perfect Property", {
    x: 0.5,
    y: 2.0,
    w: "90%",
    fontSize: 32,
    fontFace: "Arial",
    color: "C8A96E",
    bold: true,
    align: "center",
  });

  contactSlide.addText("CIRCA PANAMA", {
    x: 0.5,
    y: 3.5,
    w: "90%",
    fontSize: 20,
    fontFace: "Arial",
    color: "FFFFFF",
    align: "center",
  });

  contactSlide.addText("info@circapanama.com | michael@circapanama.com", {
    x: 0.5,
    y: 4.3,
    w: "90%",
    fontSize: 14,
    fontFace: "Arial",
    color: "888888",
    align: "center",
  });

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return buffer;
}
