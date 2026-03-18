import { NextRequest, NextResponse } from "next/server";
import { generatePresentation } from "@/lib/generate-pptx";
import { PROPERTIES } from "@/lib/properties";

export async function POST(request: NextRequest) {
  const { customerName, propertyNames } = (await request.json()) as {
    customerName: string;
    propertyNames: string[];
  };

  const selectedProperties = PROPERTIES.filter((p) =>
    propertyNames.some(
      (name) => p.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.name.toLowerCase())
    )
  );

  if (selectedProperties.length === 0) {
    return NextResponse.json({ error: "No matching properties found" }, { status: 400 });
  }

  const buffer = await generatePresentation(selectedProperties, customerName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="Circa_${customerName.replace(/\s+/g, "_")}_Presentation.pptx"`,
    },
  });
}
