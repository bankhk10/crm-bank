import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByRole("button", { name: "🔧 Admin Login (DEV)" }).click();
  await page.getByRole("button", { name: "แผนงานกิจกรรม" }).click();
  await page.getByRole("link", { name: "แผนงาน (Trip Plan)" }).click();
  await page.getByRole("button", { name: "สร้างแผนงานใหม่" }).click();

  // ชื่อกิจกรรม
  await page
    .getByRole("textbox", { name: "เช่น กิจกรรมส่งเสริมการขายตราปืนใหญ่" })
    .fill("ทดสอบ");

  // ประเภทงาน -> เลือก Type 1
  await page
    .locator("div")
    .filter({ hasText: /^เลือกประเภทงาน\.\.\.$/ })
    .click();
  await page
    .getByRole("button", { name: "เข้าพบร้านค้า / Key Farmer (" })
    .click();

  // 1. เลือกจังหวัด (เจาะจงคลิกที่ตัวเลือก [cmdk-item] แทนการคลิกที่กล่อง listbox)
  await page
    .getByRole("combobox")
    .filter({ hasText: /^เลือกจังหวัด$/ })
    .click();
  await page.locator("[cmdk-item]:visible").first().click();

  // 2. เลือกเกษตรกร (ในระบบ) — หากจังหวัดที่เลือกมีเกษตรกรให้คลิกตัวแรก หากไม่มีให้สลับกรอกนอกระบบ
  await page
    .getByRole("combobox")
    .filter({ hasText: "เลือกเกษตรกร (Customer Master)" })
    .click();
  const farmerItems = page.locator("[cmdk-item]:visible");
  if ((await farmerItems.count()) > 0) {
    await farmerItems.first().click();
  } else {
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "+ ระบุเกษตรกรไม่มีในระบบ" }).click();
    await page.getByPlaceholder("ระบุชื่อ-สกุล เกษตรกร").fill("นายสมชาย ทดสอบ");
    await page.getByPlaceholder("08X-XXX-XXXX").fill("081-234-5678");
  }

  // 3. เลือกประเด็นหลัก
  await page.locator("#planned-topic-1").click();
  await page
    .locator("[cmdk-item]:visible")
    .filter({ hasText: "ให้คำแนะนำการใช้สินค้า" })
    .first()
    .click();

  // 4. รายละเอียดเพิ่มเติมการเข้าพบ
  await page
    .getByRole("textbox", { name: "ระบุรายละเอียดเพิ่มเติมการเข้าพบ" })
    .fill("ทดสอบรายละเอียดการเข้าพบ");

  // 5. งบประมาณและค่าใช้จ่าย — สื่อส่งเสริมการขาย
  await page.getByRole("button", { name: "สื่อส่งเสริมการขาย" }).click();
  await page.locator('[id^="category-combobox-"]').first().click();
  await page
    .locator("[cmdk-item]:visible")
    .filter({ hasText: "อื่นๆ" })
    .first()
    .click();
  await page
    .getByPlaceholder("ระบุชื่อรายการ...")
    .first()
    .fill("ป้ายไวนิลโปรโมชั่น");
  await page.locator("table select").first().selectOption("ผืน");
  const marketingRowInputs = page
    .locator("table")
    .first()
    .locator("tbody tr")
    .first()
    .locator('input[type="number"]');
  await marketingRowInputs.nth(0).fill("450");
  await marketingRowInputs.nth(1).fill("4");

  // 6. งบประมาณและค่าใช้จ่าย — รายการส่งเสริมการขาย
  await page.getByRole("button", { name: "รายการส่งเสริมการขาย" }).click();
  await page.getByRole("button", { name: "เพิ่มรายการ" }).last().click();
  await page
    .getByPlaceholder("ระบุรายละเอียดรายการ...")
    .first()
    .fill("ค่าอาหารและเครื่องดื่มรับรองลูกค้า");
  await page.getByPlaceholder("0").first().fill("1500");
  await page.locator('[id^="budget-type-combobox-"]').first().click();
  await page
    .locator("[cmdk-item]:visible")
    .filter({ hasText: "งบการตลาด" })
    .first()
    .click();

  // 7. หมายเหตุเพิ่มเติมด้านล่าง
  await page
    .getByPlaceholder("ข้อมูลเพิ่มเติมอื่นๆ...")
    .fill("หมายเหตุเพิ่มเติมสำหรับการทดสอบ");

  await page.pause();
});
