import PptxGenJS from "pptxgenjs";
import { Property } from "./types";

// -- Design System (matches Circa Panama site) --
const COLORS = {
  gold: "2563EB",
  goldLight: "3B82F6",
  goldDim: "1D4ED8",
  dark: "FFFFFF",
  darkAlt: "F1F5F9",
  surface: "F8FAFC",
  surfaceLight: "E2E8F0",
  white: "1E293B",
  textPrimary: "1E293B",
  textSecondary: "475569",
  textMuted: "64748B",
  textDim: "94A3B8",
  border: "CBD5E1",
  accent: "2563EB",
};

const FONTS = {
  display: "Georgia",
  body: "Calibri",
};

// Slide dimensions (LAYOUT_WIDE = 13.33 x 7.5)
const W = 13.33;
const H = 7.5;
const MARGIN = 0.7;
const CONTENT_W = W - MARGIN * 2;

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function addFooter(slide: PptxGenJS.Slide, text = "CIRCA PANAMA  |  CONFIDENTIAL") {
  // Footer line
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: MARGIN,
    y: H - 0.6,
    w: CONTENT_W,
    h: 0.003,
    fill: { color: COLORS.border },
  });
  slide.addText(text, {
    x: MARGIN,
    y: H - 0.55,
    w: CONTENT_W,
    h: 0.35,
    fontSize: 8,
    fontFace: FONTS.body,
    color: COLORS.textDim,
    align: "right",
    charSpacing: 2,
  });
}

function addCard(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor = COLORS.surface
) {
  slide.addShape("roundRect" as PptxGenJS.ShapeType, {
    x,
    y,
    w,
    h,
    fill: { color: fillColor },
    rectRadius: 0.08,
    shadow: {
      type: "outer",
      color: "000000",
      blur: 8,
      offset: 2,
      angle: 135,
      opacity: 0.3,
    },
  });
}

function addDecorativeLine(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number
) {
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x,
    y,
    w,
    h: 0.025,
    fill: { color: COLORS.gold },
  });
}

function addSectionTitle(
  slide: PptxGenJS.Slide,
  title: string,
  y: number,
  subtitle?: string
) {
  slide.addText(title, {
    x: MARGIN,
    y,
    w: CONTENT_W,
    h: 0.55,
    fontSize: 28,
    fontFace: FONTS.display,
    color: COLORS.gold,
    bold: true,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: MARGIN,
      y: y + 0.55,
      w: CONTENT_W,
      h: 0.35,
      fontSize: 13,
      fontFace: FONTS.body,
      color: COLORS.textSecondary,
    });
  }
}

function addSlideBackground(slide: PptxGenJS.Slide) {
  slide.background = { color: COLORS.dark };
  // Subtle top accent stripe
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: W,
    h: 0.04,
    fill: { color: COLORS.gold },
  });
}

export async function generatePresentation(
  properties: Property[],
  customerName: string
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Circa Panama";
  pptx.subject = `Property Presentation for ${customerName}`;

  // Fallback images for properties with broken/missing photos
  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=500&fit=crop",
  ];

  // Pre-fetch all images with fallback
  const imageMap = new Map<string, string>();
  await Promise.all(
    properties.map(async (p) => {
      const url = p.imageUrl;
      let data = url ? await fetchImageAsBase64(url) : null;
      if (!data) {
        const idx = p.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACK_IMAGES.length;
        data = await fetchImageAsBase64(FALLBACK_IMAGES[idx]);
      }
      if (data) imageMap.set(p.name, data);
    })
  );

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ============================================================
  // SLIDE 1 - TITLE
  // ============================================================
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: COLORS.dark };

  // Large decorative gold rectangle - left accent
  titleSlide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: 0.08,
    h: H,
    fill: { color: COLORS.gold },
  });

  // Decorative corner shapes
  titleSlide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0.08,
    y: 0,
    w: 2,
    h: 0.003,
    fill: { color: COLORS.goldDim },
  });
  titleSlide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0.08,
    y: H - 0.003,
    w: 2,
    h: 0.003,
    fill: { color: COLORS.goldDim },
  });

  // Surface card for title content
  addCard(titleSlide, 1.5, 1.2, 10.3, 5.1, COLORS.darkAlt);

  // Inner border on card
  titleSlide.addShape("roundRect" as PptxGenJS.ShapeType, {
    x: 1.7,
    y: 1.4,
    w: 9.9,
    h: 4.7,
    fill: { color: "00000000" },
    rectRadius: 0.06,
    line: { color: COLORS.border, width: 0.5 },
  });

  // Company name
  titleSlide.addText("C I R C A", {
    x: 1.5,
    y: 1.8,
    w: 10.3,
    fontSize: 56,
    fontFace: FONTS.display,
    color: COLORS.gold,
    bold: true,
    align: "center",
    charSpacing: 8,
  });

  // Gold line separator
  addDecorativeLine(titleSlide, 5.2, 3.1, 3);

  // Subtitle
  titleSlide.addText("PANAMA REAL ESTATE", {
    x: 1.5,
    y: 3.35,
    w: 10.3,
    fontSize: 16,
    fontFace: FONTS.body,
    color: COLORS.textSecondary,
    align: "center",
    charSpacing: 6,
  });

  // Prepared for
  titleSlide.addText("Exclusive Selection Prepared For", {
    x: 1.5,
    y: 4.3,
    w: 10.3,
    fontSize: 11,
    fontFace: FONTS.body,
    color: COLORS.textMuted,
    align: "center",
    charSpacing: 3,
  });

  titleSlide.addText(customerName, {
    x: 1.5,
    y: 4.8,
    w: 10.3,
    fontSize: 26,
    fontFace: FONTS.display,
    color: COLORS.white,
    bold: true,
    align: "center",
  });

  // Date at bottom
  titleSlide.addText(date, {
    x: 1.5,
    y: 5.6,
    w: 10.3,
    fontSize: 10,
    fontFace: FONTS.body,
    color: COLORS.textDim,
    align: "center",
    charSpacing: 2,
  });

  // ============================================================
  // SLIDE 2 - PORTFOLIO OVERVIEW
  // ============================================================
  const overviewSlide = pptx.addSlide();
  addSlideBackground(overviewSlide);

  addSectionTitle(
    overviewSlide,
    "Portfolio Overview",
    0.4,
    `${properties.length} curated properties selected to match your investment criteria`
  );

  addDecorativeLine(overviewSlide, MARGIN, 1.25, 1.5);

  // Property summary cards in a grid
  const cardW = 3.7;
  const cardH = 1.6;
  const gapX = 0.35;
  const gapY = 0.3;
  const cols = 3;
  const startY = 1.6;

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = MARGIN + col * (cardW + gapX);
    const cy = startY + row * (cardH + gapY);

    if (cy + cardH > H - 0.7) break; // Don't overflow

    addCard(overviewSlide, cx, cy, cardW, cardH);

    // Gold accent on left of card
    overviewSlide.addShape("rect" as PptxGenJS.ShapeType, {
      x: cx,
      y: cy,
      w: 0.04,
      h: cardH,
      fill: { color: COLORS.gold },
    });

    // Property name
    overviewSlide.addText(p.name, {
      x: cx + 0.2,
      y: cy + 0.12,
      w: cardW - 0.35,
      h: 0.35,
      fontSize: 14,
      fontFace: FONTS.display,
      color: COLORS.white,
      bold: true,
    });

    // Location
    overviewSlide.addText(p.location, {
      x: cx + 0.2,
      y: cy + 0.45,
      w: cardW - 0.35,
      h: 0.25,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.textMuted,
      charSpacing: 1,
    });

    // Divider inside card
    overviewSlide.addShape("rect" as PptxGenJS.ShapeType, {
      x: cx + 0.2,
      y: cy + 0.72,
      w: cardW - 0.4,
      h: 0.003,
      fill: { color: COLORS.border },
    });

    // Price
    overviewSlide.addText(p.price ? `$${p.price}` : "Price on request", {
      x: cx + 0.2,
      y: cy + 0.8,
      w: cardW - 0.35,
      h: 0.3,
      fontSize: p.price ? 16 : 11,
      fontFace: FONTS.display,
      color: p.price ? COLORS.gold : COLORS.textMuted,
      bold: true,
    });

    // Details row
    const detailParts: string[] = [];
    if (p.bedrooms) detailParts.push(`${p.bedrooms} Bed`);
    if (p.bathrooms) detailParts.push(`${p.bathrooms} Bath`);
    if (p.constructionSize) detailParts.push(`${p.constructionSize} m\u00B2`);
    if (p.category) detailParts.push(p.category);

    overviewSlide.addText(detailParts.join("  |  "), {
      x: cx + 0.2,
      y: cy + 1.15,
      w: cardW - 0.35,
      h: 0.25,
      fontSize: 9,
      fontFace: FONTS.body,
      color: COLORS.textSecondary,
    });
  }

  addFooter(overviewSlide);

  // ============================================================
  // INDIVIDUAL PROPERTY SLIDES
  // ============================================================
  for (const property of properties) {
    // -- PROPERTY HERO SLIDE --
    const slide = pptx.addSlide();
    addSlideBackground(slide);

    const imageData = imageMap.get(property.name);
    const hasImage = !!imageData;

    if (hasImage) {
      // Full-width image at top with overlay
      slide.addImage({
        data: imageData,
        x: MARGIN,
        y: 0.35,
        w: CONTENT_W,
        h: 3.8,
        rounding: true,
      });

      // Dark gradient overlay on bottom of image for text readability
      slide.addShape("roundRect" as PptxGenJS.ShapeType, {
        x: MARGIN,
        y: 2.7,
        w: CONTENT_W,
        h: 1.45,
        fill: { color: COLORS.dark, transparency: 25 },
        rectRadius: 0.08,
      });

      // Property name on image
      slide.addText(property.name, {
        x: MARGIN + 0.4,
        y: 2.85,
        w: 7,
        h: 0.55,
        fontSize: 30,
        fontFace: FONTS.display,
        color: COLORS.white,
        bold: true,
      });

      // Location + category badge on image
      slide.addText(`${property.location}  |  ${property.category}`, {
        x: MARGIN + 0.4,
        y: 3.35,
        w: 6,
        h: 0.3,
        fontSize: 12,
        fontFace: FONTS.body,
        color: COLORS.textSecondary,
      });

      // Price badge overlay
      if (property.price) {
        addCard(slide, W - MARGIN - 3.2, 3.0, 2.8, 0.7, COLORS.surface);
        slide.addText(`$${property.price}`, {
          x: W - MARGIN - 3.2,
          y: 3.0,
          w: 2.8,
          h: 0.7,
          fontSize: 22,
          fontFace: FONTS.display,
          color: COLORS.gold,
          bold: true,
          align: "center",
          valign: "middle",
        });
      }
    } else {
      // No image - text-based header
      addCard(slide, MARGIN, 0.35, CONTENT_W, 1.5, COLORS.surface);

      slide.addText(property.name, {
        x: MARGIN + 0.4,
        y: 0.5,
        w: 8,
        h: 0.55,
        fontSize: 30,
        fontFace: FONTS.display,
        color: COLORS.gold,
        bold: true,
      });

      slide.addText(`${property.location}  |  ${property.category}`, {
        x: MARGIN + 0.4,
        y: 1.05,
        w: 6,
        h: 0.3,
        fontSize: 12,
        fontFace: FONTS.body,
        color: COLORS.textSecondary,
      });

      if (property.price) {
        slide.addText(`$${property.price}`, {
          x: W - MARGIN - 3,
          y: 0.55,
          w: 2.6,
          h: 0.5,
          fontSize: 24,
          fontFace: FONTS.display,
          color: COLORS.gold,
          bold: true,
          align: "right",
        });
      }
    }

    // Details section - card-based layout
    const detailsY = hasImage ? 4.4 : 2.2;

    // Key specs cards
    const specs: Array<{ label: string; value: string }> = [];
    if (property.bedrooms) specs.push({ label: "BEDROOMS", value: property.bedrooms });
    if (property.bathrooms) specs.push({ label: "BATHROOMS", value: property.bathrooms });
    if (property.constructionSize) specs.push({ label: "BUILT AREA", value: `${property.constructionSize} m\u00B2` });
    if (property.lotSize) specs.push({ label: "LOT SIZE", value: `${property.lotSize} m\u00B2` });
    if (property.parking) specs.push({ label: "PARKING", value: property.parking });
    if (property.status) specs.push({ label: "STATUS", value: property.status });

    const specCardW = Math.min(1.8, (CONTENT_W - 0.2 * (specs.length - 1)) / specs.length);
    const specGap = 0.2;

    for (let i = 0; i < Math.min(specs.length, 6); i++) {
      const sx = MARGIN + i * (specCardW + specGap);
      addCard(slide, sx, detailsY, specCardW, 1.05, COLORS.surface);

      slide.addText(specs[i].value, {
        x: sx,
        y: detailsY + 0.12,
        w: specCardW,
        h: 0.45,
        fontSize: 18,
        fontFace: FONTS.display,
        color: COLORS.white,
        bold: true,
        align: "center",
      });

      slide.addText(specs[i].label, {
        x: sx,
        y: detailsY + 0.6,
        w: specCardW,
        h: 0.3,
        fontSize: 8,
        fontFace: FONTS.body,
        color: COLORS.textMuted,
        align: "center",
        charSpacing: 2,
      });
    }

    // Amenities row
    if (property.amenities) {
      const amenityList = property.amenities.split(",").map((a) => a.trim());
      const amenityY = detailsY + 1.25;
      const amenityText = amenityList.join("  \u2022  ");

      addCard(slide, MARGIN, amenityY, CONTENT_W, 0.55, COLORS.surface);
      slide.addText(amenityText, {
        x: MARGIN + 0.3,
        y: amenityY,
        w: CONTENT_W - 0.6,
        h: 0.55,
        fontSize: 10,
        fontFace: FONTS.body,
        color: COLORS.textSecondary,
        valign: "middle",
      });
    }

    // Notes
    if (property.notes) {
      slide.addText(property.notes, {
        x: MARGIN,
        y: H - 1.0,
        w: CONTENT_W,
        h: 0.3,
        fontSize: 10,
        fontFace: FONTS.body,
        color: COLORS.textDim,
        italic: true,
      });
    }

    // Developer
    if (property.ownerDeveloper) {
      slide.addText(`Developer: ${property.ownerDeveloper}`, {
        x: MARGIN,
        y: H - 0.75,
        w: 5,
        h: 0.25,
        fontSize: 9,
        fontFace: FONTS.body,
        color: COLORS.textDim,
      });
    }

    addFooter(slide);

    // ============================================================
    // UNIT TYPES SLIDE (if applicable)
    // ============================================================
    if (property.unitTypes && property.unitTypes.length > 0) {
      const unitsSlide = pptx.addSlide();
      addSlideBackground(unitsSlide);

      addSectionTitle(
        unitsSlide,
        `${property.name}`,
        0.4,
        "Available Unit Types & Pricing"
      );
      addDecorativeLine(unitsSlide, MARGIN, 1.25, 1.5);

      // Unit cards instead of table
      const unitCardW = (CONTENT_W - 0.3 * (Math.min(property.unitTypes.length, 4) - 1)) / Math.min(property.unitTypes.length, 4);
      const unitStartY = 1.6;

      for (let i = 0; i < property.unitTypes.length; i++) {
        const unit = property.unitTypes[i];
        const col = i % 4;
        const row = Math.floor(i / 4);
        const ux = MARGIN + col * (unitCardW + 0.3);
        const uy = unitStartY + row * 3.0;

        addCard(unitsSlide, ux, uy, unitCardW, 2.6, COLORS.surface);

        // Gold top accent
        unitsSlide.addShape("rect" as PptxGenJS.ShapeType, {
          x: ux,
          y: uy,
          w: unitCardW,
          h: 0.04,
          fill: { color: COLORS.gold },
        });

        // Unit name
        unitsSlide.addText(unit.name, {
          x: ux + 0.2,
          y: uy + 0.2,
          w: unitCardW - 0.4,
          h: 0.35,
          fontSize: 16,
          fontFace: FONTS.display,
          color: COLORS.white,
          bold: true,
        });

        // Beds
        const beds = unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms} Bedroom`;
        unitsSlide.addText(beds, {
          x: ux + 0.2,
          y: uy + 0.55,
          w: unitCardW - 0.4,
          h: 0.25,
          fontSize: 11,
          fontFace: FONTS.body,
          color: COLORS.textMuted,
        });

        // Divider
        unitsSlide.addShape("rect" as PptxGenJS.ShapeType, {
          x: ux + 0.2,
          y: uy + 0.9,
          w: unitCardW - 0.4,
          h: 0.003,
          fill: { color: COLORS.border },
        });

        // Indoor area
        unitsSlide.addText("INDOOR", {
          x: ux + 0.2,
          y: uy + 1.0,
          w: unitCardW / 2 - 0.3,
          h: 0.2,
          fontSize: 8,
          fontFace: FONTS.body,
          color: COLORS.textMuted,
          charSpacing: 1,
        });
        unitsSlide.addText(`${unit.indoorSqm} m\u00B2`, {
          x: ux + 0.2,
          y: uy + 1.2,
          w: unitCardW / 2 - 0.3,
          h: 0.25,
          fontSize: 14,
          fontFace: FONTS.display,
          color: COLORS.white,
          bold: true,
        });

        // Outdoor area
        unitsSlide.addText("OUTDOOR", {
          x: ux + unitCardW / 2 + 0.1,
          y: uy + 1.0,
          w: unitCardW / 2 - 0.3,
          h: 0.2,
          fontSize: 8,
          fontFace: FONTS.body,
          color: COLORS.textMuted,
          charSpacing: 1,
        });
        unitsSlide.addText(`${unit.outdoorSqm} m\u00B2`, {
          x: ux + unitCardW / 2 + 0.1,
          y: uy + 1.2,
          w: unitCardW / 2 - 0.3,
          h: 0.25,
          fontSize: 14,
          fontFace: FONTS.display,
          color: COLORS.white,
          bold: true,
        });

        // Price range
        const priceRange =
          unit.priceFrom && unit.priceTo
            ? `$${unit.priceFrom.toLocaleString()} - $${unit.priceTo.toLocaleString()}`
            : "Price on request";

        // Price background accent
        unitsSlide.addShape("roundRect" as PptxGenJS.ShapeType, {
          x: ux + 0.15,
          y: uy + 1.65,
          w: unitCardW - 0.3,
          h: 0.65,
          fill: { color: COLORS.darkAlt },
          rectRadius: 0.05,
        });

        unitsSlide.addText("FROM", {
          x: ux + 0.2,
          y: uy + 1.7,
          w: unitCardW - 0.4,
          h: 0.18,
          fontSize: 8,
          fontFace: FONTS.body,
          color: COLORS.textMuted,
          charSpacing: 1,
        });
        unitsSlide.addText(priceRange, {
          x: ux + 0.2,
          y: uy + 1.9,
          w: unitCardW - 0.4,
          h: 0.3,
          fontSize: 13,
          fontFace: FONTS.display,
          color: COLORS.gold,
          bold: true,
        });
      }

      // Entry price and market comparison
      if (property.entryPricePerSqm || property.marketPricePerSqm) {
        const infoY = H - 1.4;
        addCard(unitsSlide, MARGIN, infoY, CONTENT_W, 0.65, COLORS.surface);

        const infoParts: string[] = [];
        if (property.entryPricePerSqm) infoParts.push(`Entry Price: ${property.entryPricePerSqm}`);
        if (property.marketPricePerSqm) infoParts.push(`Market Average: ${property.marketPricePerSqm}`);

        unitsSlide.addText(infoParts.join("     |     "), {
          x: MARGIN + 0.3,
          y: infoY,
          w: CONTENT_W - 0.6,
          h: 0.65,
          fontSize: 13,
          fontFace: FONTS.body,
          color: COLORS.gold,
          bold: true,
          valign: "middle",
        });
      }

      addFooter(unitsSlide);
    }

    // ============================================================
    // ROI & INVESTMENT SLIDE (if applicable)
    // ============================================================
    if (property.rentalProjections && property.rentalProjections.length > 0) {
      const roiSlide = pptx.addSlide();
      addSlideBackground(roiSlide);

      addSectionTitle(
        roiSlide,
        `${property.name}`,
        0.4,
        "Investment Returns & Rental Projections"
      );
      addDecorativeLine(roiSlide, MARGIN, 1.25, 1.5);

      // ROI highlight card
      if (property.roiEstimate) {
        addCard(roiSlide, MARGIN, 1.55, 4, 1.1, COLORS.surface);

        // Gold accent
        roiSlide.addShape("rect" as PptxGenJS.ShapeType, {
          x: MARGIN,
          y: 1.55,
          w: 0.04,
          h: 1.1,
          fill: { color: COLORS.gold },
        });

        roiSlide.addText("EXPECTED ROI", {
          x: MARGIN + 0.25,
          y: 1.65,
          w: 3.5,
          h: 0.22,
          fontSize: 9,
          fontFace: FONTS.body,
          color: COLORS.textMuted,
          charSpacing: 2,
        });

        roiSlide.addText(property.roiEstimate, {
          x: MARGIN + 0.25,
          y: 1.9,
          w: 3.5,
          h: 0.55,
          fontSize: 28,
          fontFace: FONTS.display,
          color: COLORS.gold,
          bold: true,
        });
      }

      // Rental projection cards
      const projStartY = property.roiEstimate ? 2.9 : 1.6;
      const projCardW = (CONTENT_W - 0.3 * (Math.min(property.rentalProjections.length, 4) - 1)) / Math.min(property.rentalProjections.length, 4);

      for (let i = 0; i < property.rentalProjections.length; i++) {
        const proj = property.rentalProjections[i];
        const col = i % 4;
        const row = Math.floor(i / 4);
        const px = MARGIN + col * (projCardW + 0.3);
        const py = projStartY + row * 2.6;

        addCard(roiSlide, px, py, projCardW, 2.2, COLORS.surface);

        // Gold top accent
        roiSlide.addShape("rect" as PptxGenJS.ShapeType, {
          x: px,
          y: py,
          w: projCardW,
          h: 0.04,
          fill: { color: COLORS.gold },
        });

        // Unit type
        roiSlide.addText(proj.unitType, {
          x: px + 0.2,
          y: py + 0.2,
          w: projCardW - 0.4,
          h: 0.35,
          fontSize: 15,
          fontFace: FONTS.display,
          color: COLORS.white,
          bold: true,
        });

        // Divider
        roiSlide.addShape("rect" as PptxGenJS.ShapeType, {
          x: px + 0.2,
          y: py + 0.6,
          w: projCardW - 0.4,
          h: 0.003,
          fill: { color: COLORS.border },
        });

        // Occupancy
        roiSlide.addText("OCCUPANCY", {
          x: px + 0.2,
          y: py + 0.7,
          w: projCardW - 0.4,
          h: 0.18,
          fontSize: 8,
          fontFace: FONTS.body,
          color: COLORS.textMuted,
          charSpacing: 1,
        });
        roiSlide.addText(proj.occupancyRate, {
          x: px + 0.2,
          y: py + 0.88,
          w: projCardW - 0.4,
          h: 0.28,
          fontSize: 16,
          fontFace: FONTS.display,
          color: COLORS.white,
          bold: true,
        });

        // Nightly rate
        roiSlide.addText("NIGHTLY RATE", {
          x: px + 0.2,
          y: py + 1.2,
          w: projCardW - 0.4,
          h: 0.18,
          fontSize: 8,
          fontFace: FONTS.body,
          color: COLORS.textMuted,
          charSpacing: 1,
        });
        roiSlide.addText(`$${proj.nightlyRate}`, {
          x: px + 0.2,
          y: py + 1.38,
          w: projCardW - 0.4,
          h: 0.28,
          fontSize: 16,
          fontFace: FONTS.display,
          color: COLORS.gold,
          bold: true,
        });

        // Monthly rent
        roiSlide.addText("MONTHLY RENT", {
          x: px + 0.2,
          y: py + 1.7,
          w: projCardW - 0.4,
          h: 0.18,
          fontSize: 8,
          fontFace: FONTS.body,
          color: COLORS.textMuted,
          charSpacing: 1,
        });
        roiSlide.addText(`$${proj.monthlyRent.toLocaleString()}`, {
          x: px + 0.2,
          y: py + 1.88,
          w: projCardW - 0.4,
          h: 0.28,
          fontSize: 16,
          fontFace: FONTS.display,
          color: COLORS.gold,
          bold: true,
        });
      }

      // Disclaimer
      roiSlide.addText(
        "Rental prices listed are before management fees. Projections based on current market data.",
        {
          x: MARGIN,
          y: H - 1.0,
          w: CONTENT_W,
          h: 0.3,
          fontSize: 9,
          fontFace: FONTS.body,
          color: COLORS.textDim,
          italic: true,
        }
      );

      addFooter(roiSlide);
    }

    // ============================================================
    // LIFESTYLE & COMMUNITY SLIDE (if applicable)
    // ============================================================
    if (property.ecoFeatures || property.communityFeatures) {
      const featSlide = pptx.addSlide();
      addSlideBackground(featSlide);

      addSectionTitle(
        featSlide,
        `${property.name}`,
        0.4,
        "Lifestyle, Sustainability & Community"
      );
      addDecorativeLine(featSlide, MARGIN, 1.25, 1.5);

      const hasEco = property.ecoFeatures && property.ecoFeatures.length > 0;
      const hasCom = property.communityFeatures && property.communityFeatures.length > 0;
      const halfW = (CONTENT_W - 0.4) / 2;

      if (hasEco) {
        const ecoX = hasCom ? MARGIN : MARGIN;
        const ecoW = hasCom ? halfW : CONTENT_W;
        addCard(featSlide, ecoX, 1.6, ecoW, 4.8, COLORS.surface);

        // Section header with gold accent
        featSlide.addShape("rect" as PptxGenJS.ShapeType, {
          x: ecoX,
          y: 1.6,
          w: ecoW,
          h: 0.04,
          fill: { color: "4A9A6E" }, // Green accent for eco
        });

        featSlide.addText("Eco-Friendly Development", {
          x: ecoX + 0.3,
          y: 1.85,
          w: ecoW - 0.6,
          h: 0.35,
          fontSize: 16,
          fontFace: FONTS.display,
          color: COLORS.white,
          bold: true,
        });

        let ey = 2.35;
        for (const feat of property.ecoFeatures!) {
          // Bullet dot
          featSlide.addShape("ellipse" as PptxGenJS.ShapeType, {
            x: ecoX + 0.35,
            y: ey + 0.08,
            w: 0.08,
            h: 0.08,
            fill: { color: "4A9A6E" },
          });

          featSlide.addText(feat, {
            x: ecoX + 0.55,
            y: ey,
            w: ecoW - 0.9,
            h: 0.3,
            fontSize: 12,
            fontFace: FONTS.body,
            color: COLORS.textSecondary,
          });
          ey += 0.4;
        }
      }

      if (hasCom) {
        const comX = hasEco ? MARGIN + halfW + 0.4 : MARGIN;
        const comW = hasEco ? halfW : CONTENT_W;
        addCard(featSlide, comX, 1.6, comW, 4.8, COLORS.surface);

        // Section header
        featSlide.addShape("rect" as PptxGenJS.ShapeType, {
          x: comX,
          y: 1.6,
          w: comW,
          h: 0.04,
          fill: { color: COLORS.accent },
        });

        featSlide.addText("Community & Lifestyle", {
          x: comX + 0.3,
          y: 1.85,
          w: comW - 0.6,
          h: 0.35,
          fontSize: 16,
          fontFace: FONTS.display,
          color: COLORS.white,
          bold: true,
        });

        let cy = 2.35;
        for (const feat of property.communityFeatures!) {
          featSlide.addShape("ellipse" as PptxGenJS.ShapeType, {
            x: comX + 0.35,
            y: cy + 0.08,
            w: 0.08,
            h: 0.08,
            fill: { color: COLORS.accent },
          });

          featSlide.addText(feat, {
            x: comX + 0.55,
            y: cy,
            w: comW - 0.9,
            h: 0.3,
            fontSize: 12,
            fontFace: FONTS.body,
            color: COLORS.textSecondary,
          });
          cy += 0.4;
        }
      }

      addFooter(featSlide);
    }
  }

  // ============================================================
  // MARKET ANALYSIS SLIDES
  // ============================================================

  // -- SLIDE: Price Comparison Bar Chart --
  const propsWithPrice = properties.filter((p) => p.price && parseFloat(p.price.replace(/,/g, "")) > 0);
  if (propsWithPrice.length > 1) {
    const priceChartSlide = pptx.addSlide();
    addSlideBackground(priceChartSlide);
    addSectionTitle(priceChartSlide, "Price Comparison", 0.4, "Selected properties side by side");
    addDecorativeLine(priceChartSlide, MARGIN, 1.25, 1.5);

    const priceData = [
      {
        name: "Price (USD)",
        labels: propsWithPrice.map((p) => p.name.length > 18 ? p.name.substring(0, 16) + "..." : p.name),
        values: propsWithPrice.map((p) => parseFloat(p.price.replace(/,/g, ""))),
      },
    ];

    priceChartSlide.addChart("bar" as PptxGenJS.CHART_NAME, priceData, {
      x: MARGIN,
      y: 1.5,
      w: CONTENT_W,
      h: 4.8,
      barDir: "col",
      barGrouping: "clustered",
      chartColors: [COLORS.gold],
      showValue: true,
      dataLabelFontSize: 9,
      dataLabelColor: COLORS.white,
      catAxisLabelColor: COLORS.textSecondary,
      catAxisLabelFontSize: 9,
      catAxisLabelRotate: propsWithPrice.length > 6 ? 45 : 0,
      valAxisLabelColor: COLORS.textMuted,
      valAxisLabelFontSize: 8,
      valAxisLabelFormatCode: "$#,##0",
      showLegend: false,
      plotArea: { fill: { color: COLORS.surface } },
    });

    addFooter(priceChartSlide);
  }

  // -- SLIDE: Price per m2 Value Analysis --
  const propsWithSqm = properties.filter(
    (p) => p.price && p.constructionSize && parseFloat(p.price.replace(/,/g, "")) > 0 && parseFloat(p.constructionSize) > 0
  );
  if (propsWithSqm.length > 1) {
    const sqmSlide = pptx.addSlide();
    addSlideBackground(sqmSlide);
    addSectionTitle(sqmSlide, "Value Analysis", 0.4, "Price per m\u00B2 - lower means better value");
    addDecorativeLine(sqmSlide, MARGIN, 1.25, 1.5);

    const sqmValues = propsWithSqm.map((p) => {
      const price = parseFloat(p.price.replace(/,/g, ""));
      const size = parseFloat(p.constructionSize);
      return Math.round(price / size);
    });

    const avgSqm = Math.round(sqmValues.reduce((a, b) => a + b, 0) / sqmValues.length);

    const sqmData = [
      {
        name: "Price/m\u00B2",
        labels: propsWithSqm.map((p) => p.name.length > 18 ? p.name.substring(0, 16) + "..." : p.name),
        values: sqmValues,
      },
      {
        name: "Market Average",
        labels: propsWithSqm.map((p) => p.name.length > 18 ? p.name.substring(0, 16) + "..." : p.name),
        values: propsWithSqm.map(() => avgSqm),
      },
    ];

    sqmSlide.addChart("bar" as PptxGenJS.CHART_NAME, sqmData, {
      x: MARGIN,
      y: 1.5,
      w: CONTENT_W,
      h: 4.8,
      barDir: "col",
      barGrouping: "clustered",
      chartColors: [COLORS.gold, COLORS.textDim],
      showValue: true,
      dataLabelFontSize: 8,
      dataLabelColor: COLORS.white,
      catAxisLabelColor: COLORS.textSecondary,
      catAxisLabelFontSize: 9,
      catAxisLabelRotate: propsWithSqm.length > 6 ? 45 : 0,
      valAxisLabelColor: COLORS.textMuted,
      valAxisLabelFontSize: 8,
      valAxisLabelFormatCode: "$#,##0",
      showLegend: true,
      legendPos: "t",
      legendColor: COLORS.textSecondary,
      legendFontSize: 9,
      plotArea: { fill: { color: COLORS.surface } },
    });

    addFooter(sqmSlide);
  }

  // -- SLIDE: Property Mix Doughnut + Key Stats --
  if (properties.length > 1) {
    const mixSlide = pptx.addSlide();
    addSlideBackground(mixSlide);
    addSectionTitle(mixSlide, "Market Insights", 0.4, "Portfolio breakdown and key investment metrics");
    addDecorativeLine(mixSlide, MARGIN, 1.25, 1.5);

    // Category breakdown doughnut
    const catCounts = new Map<string, number>();
    for (const p of properties) {
      catCounts.set(p.category, (catCounts.get(p.category) || 0) + 1);
    }

    const doughnutColors = ["2563EB", "3B82F6", "60A5FA", "93C5FD", "1D4ED8", "1E40AF", "BFDBFE"];
    const doughnutData = [
      {
        name: "Categories",
        labels: Array.from(catCounts.keys()),
        values: Array.from(catCounts.values()),
      },
    ];

    mixSlide.addChart("doughnut" as PptxGenJS.CHART_NAME, doughnutData, {
      x: MARGIN,
      y: 1.6,
      w: 5.5,
      h: 4.5,
      holeSize: 55,
      chartColors: doughnutColors.slice(0, catCounts.size),
      showPercent: true,
      showLabel: true,
      showLegend: true,
      legendPos: "b",
      legendColor: COLORS.textSecondary,
      legendFontSize: 9,
      dataLabelColor: COLORS.white,
      dataLabelFontSize: 10,
    });

    // Key stats cards on the right
    const statsX = 7.2;
    const statsW = CONTENT_W - statsX + MARGIN;

    const prices = properties
      .filter((p) => p.price && parseFloat(p.price.replace(/,/g, "")) > 0)
      .map((p) => parseFloat(p.price.replace(/,/g, "")));

    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const statItems = [
      { label: "PROPERTIES", value: `${properties.length}`, sub: "in this selection" },
      { label: "AVG. PRICE", value: `$${avgPrice.toLocaleString()}`, sub: "across selection" },
      { label: "PRICE RANGE", value: `$${(minPrice / 1000).toFixed(0)}K - $${(maxPrice / 1000).toFixed(0)}K`, sub: "min to max" },
      { label: "LOCATIONS", value: `${new Set(properties.map((p) => p.location)).size}`, sub: "unique areas" },
    ];

    for (let i = 0; i < statItems.length; i++) {
      const sy = 1.7 + i * 1.15;
      addCard(mixSlide, statsX, sy, statsW, 1.0, COLORS.surface);

      // Blue accent bar
      mixSlide.addShape("rect" as PptxGenJS.ShapeType, {
        x: statsX,
        y: sy,
        w: 0.04,
        h: 1.0,
        fill: { color: COLORS.gold },
      });

      mixSlide.addText(statItems[i].label, {
        x: statsX + 0.2,
        y: sy + 0.1,
        w: statsW - 0.3,
        h: 0.2,
        fontSize: 8,
        fontFace: FONTS.body,
        color: COLORS.textMuted,
        charSpacing: 2,
      });

      mixSlide.addText(statItems[i].value, {
        x: statsX + 0.2,
        y: sy + 0.3,
        w: statsW - 0.3,
        h: 0.4,
        fontSize: 22,
        fontFace: FONTS.display,
        color: COLORS.gold,
        bold: true,
      });

      mixSlide.addText(statItems[i].sub, {
        x: statsX + 0.2,
        y: sy + 0.7,
        w: statsW - 0.3,
        h: 0.2,
        fontSize: 9,
        fontFace: FONTS.body,
        color: COLORS.textDim,
      });
    }

    addFooter(mixSlide);
  }

  // -- SLIDE: ROI & Rental Analysis (if any property has rental data) --
  const propsWithRentals = properties.filter((p) => p.rentalProjections && p.rentalProjections.length > 0);
  if (propsWithRentals.length > 0) {
    const rentalSlide = pptx.addSlide();
    addSlideBackground(rentalSlide);
    addSectionTitle(rentalSlide, "Investment Returns", 0.4, "Projected annual rental revenue by unit type");
    addDecorativeLine(rentalSlide, MARGIN, 1.25, 1.5);

    const allProjections = propsWithRentals.flatMap((p) =>
      (p.rentalProjections || []).map((r) => ({ ...r, property: p.name }))
    );

    const rentalData = [
      {
        name: "Monthly Rent",
        labels: allProjections.map((r) => r.unitType),
        values: allProjections.map((r) => r.monthlyRent),
      },
    ];

    rentalSlide.addChart("bar" as PptxGenJS.CHART_NAME, rentalData, {
      x: MARGIN,
      y: 1.5,
      w: 7,
      h: 4.8,
      barDir: "bar",
      barGrouping: "clustered",
      chartColors: [COLORS.gold],
      showValue: true,
      dataLabelFontSize: 10,
      dataLabelColor: COLORS.white,
      valAxisLabelFormatCode: "$#,##0",
      catAxisLabelColor: COLORS.textSecondary,
      catAxisLabelFontSize: 10,
      valAxisLabelColor: COLORS.textMuted,
      valAxisLabelFontSize: 8,
      showLegend: false,
      plotArea: { fill: { color: COLORS.surface } },
    });

    // ROI highlight on the right
    const roiProps = properties.filter((p) => p.roiEstimate);
    if (roiProps.length > 0) {
      const roiX = 8.5;
      const roiW = CONTENT_W - roiX + MARGIN;
      addCard(rentalSlide, roiX, 1.8, roiW, 2.0, COLORS.surface);

      rentalSlide.addShape("rect" as PptxGenJS.ShapeType, {
        x: roiX,
        y: 1.8,
        w: roiW,
        h: 0.04,
        fill: { color: COLORS.gold },
      });

      rentalSlide.addText("PROJECTED ROI", {
        x: roiX + 0.2,
        y: 2.0,
        w: roiW - 0.4,
        h: 0.25,
        fontSize: 9,
        fontFace: FONTS.body,
        color: COLORS.textMuted,
        charSpacing: 2,
      });

      rentalSlide.addText(roiProps[0].roiEstimate || "", {
        x: roiX + 0.2,
        y: 2.3,
        w: roiW - 0.4,
        h: 0.6,
        fontSize: 32,
        fontFace: FONTS.display,
        color: COLORS.gold,
        bold: true,
      });

      rentalSlide.addText("Net Annual Yield", {
        x: roiX + 0.2,
        y: 2.9,
        w: roiW - 0.4,
        h: 0.25,
        fontSize: 10,
        fontFace: FONTS.body,
        color: COLORS.textSecondary,
      });

      // Annual revenue summary
      const totalAnnual = allProjections.reduce((sum, r) => sum + r.monthlyRent * 12, 0);
      addCard(rentalSlide, roiX, 4.2, roiW, 1.5, COLORS.surface);

      rentalSlide.addText("ANNUAL REVENUE", {
        x: roiX + 0.2,
        y: 4.35,
        w: roiW - 0.4,
        h: 0.2,
        fontSize: 8,
        fontFace: FONTS.body,
        color: COLORS.textMuted,
        charSpacing: 2,
      });

      rentalSlide.addText(`$${totalAnnual.toLocaleString()}`, {
        x: roiX + 0.2,
        y: 4.6,
        w: roiW - 0.4,
        h: 0.5,
        fontSize: 24,
        fontFace: FONTS.display,
        color: COLORS.gold,
        bold: true,
      });

      rentalSlide.addText("Combined projections\nbefore management fees", {
        x: roiX + 0.2,
        y: 5.1,
        w: roiW - 0.4,
        h: 0.4,
        fontSize: 9,
        fontFace: FONTS.body,
        color: COLORS.textDim,
      });
    }

    addFooter(rentalSlide);
  }

  // ============================================================
  // FINAL SLIDE - CONTACT
  // ============================================================
  const contactSlide = pptx.addSlide();
  contactSlide.background = { color: COLORS.dark };

  // Left gold accent
  contactSlide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: 0.08,
    h: H,
    fill: { color: COLORS.gold },
  });

  // Central card
  addCard(contactSlide, 2.5, 1.5, 8.3, 4.5, COLORS.darkAlt);

  // Inner border
  contactSlide.addShape("roundRect" as PptxGenJS.ShapeType, {
    x: 2.7,
    y: 1.7,
    w: 7.9,
    h: 4.1,
    fill: { color: "00000000" },
    rectRadius: 0.06,
    line: { color: COLORS.border, width: 0.5 },
  });

  // Thank you
  contactSlide.addText("Thank You", {
    x: 2.5,
    y: 2.0,
    w: 8.3,
    fontSize: 14,
    fontFace: FONTS.body,
    color: COLORS.textMuted,
    align: "center",
    charSpacing: 4,
  });

  contactSlide.addText("Let's Find Your\nPerfect Property", {
    x: 2.5,
    y: 2.5,
    w: 8.3,
    fontSize: 34,
    fontFace: FONTS.display,
    color: COLORS.gold,
    bold: true,
    align: "center",
    lineSpacingMultiple: 1.2,
  });

  // Gold separator
  addDecorativeLine(contactSlide, 5.6, 3.8, 2.1);

  contactSlide.addText("C I R C A   P A N A M A", {
    x: 2.5,
    y: 4.0,
    w: 8.3,
    fontSize: 14,
    fontFace: FONTS.body,
    color: COLORS.white,
    align: "center",
    charSpacing: 4,
  });

  contactSlide.addText("info@circapanama.com  |  michael@circapanama.com", {
    x: 2.5,
    y: 4.6,
    w: 8.3,
    fontSize: 12,
    fontFace: FONTS.body,
    color: COLORS.textMuted,
    align: "center",
    charSpacing: 1,
  });

  contactSlide.addText(`Prepared exclusively for ${customerName}`, {
    x: 2.5,
    y: 5.15,
    w: 8.3,
    fontSize: 10,
    fontFace: FONTS.body,
    color: COLORS.textDim,
    align: "center",
    italic: true,
  });

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return buffer;
}
