import fs from "fs";
import path from "path";

export function ensureTestAssetsExist() {
  const dirPath = path.join(process.cwd(), "public", "uploads", "activity-plans-seed");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const sampleSvgs: Record<string, string> = {
    "shelf-sample-1.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#e0f2fe"/><text x="50%" y="50%" font-size="20" font-weight="bold" fill="#0369a1" text-anchor="middle" dominant-baseline="middle">Shelf Display Photo</text></svg>`,
    "shelf-sample-2.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#f0fdf4"/><text x="50%" y="50%" font-size="20" font-weight="bold" fill="#15803d" text-anchor="middle" dominant-baseline="middle">Shelf Stock Photo 2</text></svg>`,
    "pricetag-sample-1.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#fef3c7"/><text x="50%" y="50%" font-size="20" font-weight="bold" fill="#b45309" text-anchor="middle" dominant-baseline="middle">Competitor Price Tag</text></svg>`,
    "pricetag-sample-2.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#fee2e2"/><text x="50%" y="50%" font-size="20" font-weight="bold" fill="#b91c1c" text-anchor="middle" dominant-baseline="middle">Competitor Price Tag 2</text></svg>`,
    "crop-sample-1.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#ecfdf5"/><text x="50%" y="50%" font-size="20" font-weight="bold" fill="#047857" text-anchor="middle" dominant-baseline="middle">Crop Growth Condition</text></svg>`,
    "plot-overview-1.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#fefce8"/><text x="50%" y="50%" font-size="20" font-weight="bold" fill="#a16207" text-anchor="middle" dominant-baseline="middle">Demo Plot Overview</text></svg>`,
    "meeting-sample-1.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#f5f3ff"/><text x="50%" y="50%" font-size="20" font-weight="bold" fill="#6d28d9" text-anchor="middle" dominant-baseline="middle">Farmer Meeting Atmosphere</text></svg>`,
    "issue-sample-1.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#fff1f2"/><text x="50%" y="50%" font-size="20" font-weight="bold" fill="#be123c" text-anchor="middle" dominant-baseline="middle">Product Issue Evidence</text></svg>`,
  };

  for (const [filename, content] of Object.entries(sampleSvgs)) {
    const filePath = path.join(dirPath, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, "utf-8");
    }
  }
}
