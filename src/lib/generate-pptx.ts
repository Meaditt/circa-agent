import PptxGenJS from "pptxgenjs";
import { Property } from "./types";

export async function generatePresentation(
  properties: Property[],
  customerName: string
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Circa Panama";
  pptx.subject = `Property Presentation for ${customerName}`;

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

  // Table header
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

    // Property name
    slide.addText(property.name, {
      x: 0.5,
      y: 0.3,
      w: "60%",
      fontSize: 32,
      fontFace: "Arial",
      color: "C8A96E",
      bold: true,
    });

    // Location badge
    slide.addText(property.location, {
      x: 0.5,
      y: 1.2,
      w: 3,
      fontSize: 14,
      fontFace: "Arial",
      color: "FFFFFF",
    });

    // Category badge
    slide.addText(property.category, {
      x: 3.5,
      y: 1.2,
      w: 2,
      fontSize: 14,
      fontFace: "Arial",
      color: "C8A96E",
    });

    // Details grid
    const details: Array<[string, string]> = [];
    if (property.price) details.push(["Price", `$${property.price}`]);
    if (property.lotSize) details.push(["Lot Size", `${property.lotSize} m²`]);
    if (property.constructionSize) details.push(["Built Area", `${property.constructionSize} m²`]);
    if (property.bedrooms) details.push(["Bedrooms", property.bedrooms]);
    if (property.bathrooms) details.push(["Bathrooms", property.bathrooms]);
    if (property.parking) details.push(["Parking", property.parking]);
    if (property.status) details.push(["Status", property.status]);

    let yPos = 2.0;
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

    // Amenities
    if (property.amenities) {
      slide.addText("Amenities", {
        x: 6.5,
        y: 2.0,
        w: 5,
        fontSize: 14,
        fontFace: "Arial",
        color: "C8A96E",
        bold: true,
      });

      const amenityList = property.amenities.split(",").map((a) => a.trim());
      let amenityY = 2.6;
      for (const amenity of amenityList) {
        slide.addText(`- ${amenity}`, {
          x: 6.5,
          y: amenityY,
          w: 5,
          fontSize: 12,
          fontFace: "Arial",
          color: "CCCCCC",
        });
        amenityY += 0.35;
      }
    }

    // Notes
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
