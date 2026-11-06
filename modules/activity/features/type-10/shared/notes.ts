/**
 * Utility functions for encoding and decoding Type 10 Field Day Notes
 */

export function encodeType10Notes(
  notes: string,
  extra?: {
    showcase?: string;
    targetCrop?: string;
    targetFarmersList?: string;
  },
): string {
  const parts: string[] = [];
  if (notes && notes.trim()) {
    parts.push(notes.trim());
  }

  if (extra?.showcase) {
    parts.push(`[สินค้าสาธิต: ${extra.showcase}]`);
  }
  if (extra?.targetCrop) {
    parts.push(`[พืชเป้าหมาย: ${extra.targetCrop}]`);
  }
  if (extra?.targetFarmersList) {
    parts.push(`[เกษตรกรเป้าหมาย: ${extra.targetFarmersList}]`);
  }

  return parts.join("\n");
}

export function decodeType10Notes(rawNotes?: string | null): {
  notes: string;
  showcase?: string;
  targetCrop?: string;
  targetFarmersList?: string;
} {
  if (!rawNotes) return { notes: "" };

  let notes = rawNotes;
  let showcase: string | undefined;
  let targetCrop: string | undefined;
  let targetFarmersList: string | undefined;

  const showcaseMatch = notes.match(/\[สินค้าสาธิต:\s*([^\]]+)\]/);
  if (showcaseMatch) {
    showcase = showcaseMatch[1].trim();
    notes = notes.replace(showcaseMatch[0], "").trim();
  }

  const cropMatch = notes.match(/\[พืชเป้าหมาย:\s*([^\]]+)\]/);
  if (cropMatch) {
    targetCrop = cropMatch[1].trim();
    notes = notes.replace(cropMatch[0], "").trim();
  }

  const farmersMatch = notes.match(/\[เกษตรกรเป้าหมาย:\s*([^\]]+)\]/);
  if (farmersMatch) {
    targetFarmersList = farmersMatch[1].trim();
    notes = notes.replace(farmersMatch[0], "").trim();
  }

  return {
    notes: notes.trim(),
    showcase,
    targetCrop,
    targetFarmersList,
  };
}
