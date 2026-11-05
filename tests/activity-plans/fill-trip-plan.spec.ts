import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByRole("button", { name: "🔧 Admin Login (DEV)" }).click();
  await page.getByRole("button", { name: "แผนงานกิจกรรม" }).click();
  await page.getByRole("link", { name: "แผนงาน (Trip Plan)" }).click();
  await page.getByRole("button", { name: "สร้างแผนงานใหม่" }).click();
  await page
    .getByRole("textbox", { name: "เช่น กิจกรรมส่งเสริมการขายตราปืนใหญ่" })
    .click();
  await page
    .getByRole("textbox", { name: "เช่น กิจกรรมส่งเสริมการขายตราปืนใหญ่" })
    .fill("ทดสอบ");
  await page.getByText("เลือกประเภทงาน...").click();
  await page
    .getByRole("button", { name: "เข้าพบร้านค้า / Key Farmer (" })
    .click();
  await page
    .getByRole("combobox")
    .filter({ hasText: /^เลือกจังหวัด$/ })
    .click();
  await page.getByRole("listbox", { name: "Suggestions" }).click();
  await page
    .getByRole("combobox")
    .filter({ hasText: "เลือกเกษตรกร (Customer Master)" })
    .click();
  await page
    .getByRole("option", {
      name: "คุณสมชาย ใจดี",
    })
    .click();

  await page.pause();
});
