import { test, expect, type Page } from "@playwright/test";

/**
 * Helper: เข้าสู่ระบบอัตโนมัติหากยังไม่ได้ Login
 */
async function loginIfNeeded(page: Page) {
  await page.goto("/activity-plans/new");

  // หากรอแล้วถูก Redirect ไปหน้า /login ให้ทำการเข้าสู่ระบบ
  if (page.url().includes("/login")) {
    const email = process.env.TEST_USER_EMAIL || "atthapol@gmail.com";
    const password = process.env.TEST_USER_PASSWORD || "atthapol@gmail.com";

    const emailInput = page.locator('input#email, input[name="email"]');
    await emailInput.waitFor({ state: "visible", timeout: 15000 });
    await emailInput.fill(email);

    const passwordInput = page.locator('input#password, input[name="password"]');
    await passwordInput.fill(password);

    // กดปุ่มเข้าสู่ระบบ
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    // รอจนกว่าจะออกจากหน้า /login
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 20000,
    });

    // ไปยังหน้าสร้างแผนงาน (Trip Plan) อีกครั้งหากถูกส่งไปหน้า /dashboard
    if (!page.url().includes("/activity-plans/new")) {
      await page.goto("/activity-plans/new");
    }
  }

  // ตรวจสอบว่าเข้าสู่หน้า "สร้างแผนงาน ( Trip Plan )" สำเร็จ
  await expect(
    page.getByRole("heading", { name: /สร้างแผนงาน.*Trip Plan/i }),
  ).toBeVisible({ timeout: 15000 });
}

test.describe("สร้างแผนงาน (Trip Plan) - Type 1 (เข้าพบร้านค้า / Key Farmer)", () => {
  test("กรอกข้อมูลลงช่องทุกช่องของหน้าสร้างแผนงาน Type 1 ครบทุกส่วน", async ({
    page,
  }) => {
    test.setTimeout(90000);

    // ─── 0. เข้าสู่ระบบและเปิดหน้าสร้างแผนงาน ───
    await loginIfNeeded(page);

    // ─── 1. ข้อมูลหลักของกิจกรรม (PlanBasicInfoCard) ───
    // 1.1 ชื่อกิจกรรม
    const titleInput = page.getByPlaceholder(
      "เช่น กิจกรรมส่งเสริมการขายตราปืนใหญ่",
    );
    await titleInput.fill(
      "แผนงานเข้าพบร้านค้าและเกษตรกร (Playwright Automated Test - Type 1)",
    );
    await expect(titleInput).toHaveValue(
      "แผนงานเข้าพบร้านค้าและเกษตรกร (Playwright Automated Test - Type 1)",
    );

    // 1.2 ประเภทงาน (เลือก Type 1: เข้าพบร้านค้า / Key Farmer)
    await page.getByText("เลือกประเภทงาน...").click();
    await page
      .getByRole("button", { name: /เข้าพบร้านค้า \/ Key Farmer \(Type 1\)/i })
      .click();

    // ตรวจสอบว่าฟอร์มของ Type 1 ปรากฏขึ้นมา
    await expect(
      page.getByText("รายการเข้าพบร้านค้า / Key Farmer (ในแผน)"),
    ).toBeVisible();

    // 1.3 วันที่เริ่ม (DateTimePicker)
    const startDateContainer = page
      .locator("div")
      .filter({ has: page.locator("label", { hasText: "วันที่เริ่ม" }) })
      .first();
    await startDateContainer.locator("button").first().click();

    const openPopover = page.locator('[data-radix-popper-content-wrapper]:visible');
    if (await openPopover.isVisible()) {
      // เลือกเวลา 09:00 น. แล้วกดตกลง
      const hour09 = openPopover.getByRole("button", { name: "09", exact: true });
      if (await hour09.isVisible()) await hour09.click();
      const min00 = openPopover.getByRole("button", { name: "00", exact: true });
      if (await min00.isVisible()) await min00.click();
      const confirmBtn = openPopover.getByRole("button", { name: "ตกลง" });
      if (await confirmBtn.isVisible()) await confirmBtn.click();
    }

    // 1.4 วันที่สิ้นสุด (DateTimePicker)
    const endDateContainer = page
      .locator("div")
      .filter({ has: page.locator("label", { hasText: "วันที่สิ้นสุด" }) })
      .first();
    await endDateContainer.locator("button").first().click();

    if (await openPopover.isVisible()) {
      // เลือกเวลา 17:30 น. แล้วกดตกลง
      const hour17 = openPopover.getByRole("button", { name: "17", exact: true });
      if (await hour17.isVisible()) await hour17.click();
      const min30 = openPopover.getByRole("button", { name: "30", exact: true });
      if (await min30.isVisible()) await min30.click();
      const confirmBtn = openPopover.getByRole("button", { name: "ตกลง" });
      if (await confirmBtn.isVisible()) await confirmBtn.click();
    }

    // ─── 2. ส่วนเฉพาะ Type 1: รายการเข้าพบร้านค้า / Key Farmer (ในแผน) ───
    // ทดสอบครบทั้ง 3 กรณี:
    //   - ลำดับที่ 1: เกษตรกร (ไม่มีในระบบ) -> กรอกจังหวัด, ชื่อ-สกุล, เบอร์โทร, ประเด็นหลัก, รายละเอียดเพิ่มเติม
    //   - ลำดับที่ 2: เกษตรกร (ในระบบ) -> เลือกจังหวัด, เลือกเกษตรกรจากฐานข้อมูล, ประเด็นหลัก, รายละเอียดเพิ่มเติม
    //   - ลำดับที่ 3: ร้านค้า (ตัวแทนจำหน่าย / ร้านค้าย่อย) -> เลือกร้านค้า, ประเด็นหลัก, รายละเอียดเพิ่มเติม

    // --- เป้าหมายลำดับที่ 1: เกษตรกร (ไม่มีในระบบ) ---
    const card1 = page
      .locator("div.rounded-xl.border")
      .filter({ hasText: "ลำดับที่ 1" })
      .first();

    // เลือกจังหวัดในลำดับที่ 1
    const provinceTrigger1 = card1
      .getByRole("combobox")
      .filter({ hasText: /เลือกจังหวัด|กำลังโหลดจังหวัด/ })
      .first();
    await expect(provinceTrigger1).toBeEnabled({ timeout: 10000 });
    await provinceTrigger1.click();
    const firstProvinceOption = page.locator("[cmdk-item]").first();
    await expect(firstProvinceOption).toBeVisible();
    await firstProvinceOption.click();

    // สลับไปโหมด "+ ระบุเกษตรกรไม่มีในระบบ" เพื่อกรอกชื่อและเบอร์โทรเกษตรกรทุกช่อง
    await card1.getByRole("button", { name: /ระบุเกษตรกรไม่มีในระบบ/ }).click();

    await card1
      .getByPlaceholder("ระบุชื่อ-สกุล เกษตรกร")
      .fill("นายสมชาย เกษตรก้าวหน้า");
    await card1.getByPlaceholder("08X-XXX-XXXX").fill("081-234-5678");

    // เลือกประเด็นหลัก (ลำดับที่ 1)
    await card1.locator('[id^="planned-topic-"]').click();
    await page
      .locator("[cmdk-item]")
      .filter({ hasText: "แนะนำสินค้า" })
      .first()
      .click();

    // กรอกรายละเอียดเพิ่มเติม (ลำดับที่ 1)
    await card1
      .getByPlaceholder("ระบุรายละเอียดเพิ่มเติมการเข้าพบ...")
      .fill("เข้าพบเกษตรกรรายใหม่ แนะนำผลิตภัณฑ์และสำรวจพื้นที่เพาะปลูก");

    // --- เป้าหมายลำดับที่ 2: เกษตรกร (ในระบบ) ---
    await page.getByRole("button", { name: /เพิ่มเป้าหมายเข้าพบ/ }).click();

    const card2 = page
      .locator("div.rounded-xl.border")
      .filter({ hasText: "ลำดับที่ 2" })
      .first();
    await expect(card2).toBeVisible();

    // เลือกจังหวัดในลำดับที่ 2
    const provinceTrigger2 = card2
      .getByRole("combobox")
      .filter({ hasText: /เลือกจังหวัด/ })
      .first();
    await provinceTrigger2.click();
    await page.locator("[cmdk-item]").first().click();

    // เลือกเกษตรกร (ในระบบ) หากในจังหวัดนั้นมีข้อมูลเกษตรกรในระบบ
    const farmerTrigger2 = card2
      .getByRole("combobox")
      .filter({ hasText: /เลือกเกษตรกร/ })
      .first();
    await expect(farmerTrigger2).toBeEnabled({ timeout: 10000 });
    await farmerTrigger2.click();

    const farmerItems = page.locator("[cmdk-item]");
    if ((await farmerItems.count()) > 0) {
      await farmerItems.first().click();
    } else {
      // หากจังหวัดที่เลือกไม่มีเกษตรกรในฐานข้อมูล ให้ปิด Popover แล้วกรอกแบบนอกระบบแทน
      await page.keyboard.press("Escape");
      await card2
        .getByRole("button", { name: /ระบุเกษตรกรไม่มีในระบบ/ })
        .click();
      await card2
        .getByPlaceholder("ระบุชื่อ-สกุล เกษตรกร")
        .fill("นางสาวสมหญิง ทดสอบระบบ");
      await card2.getByPlaceholder("08X-XXX-XXXX").fill("089-876-5432");
    }

    // เลือกประเด็นหลัก (ลำดับที่ 2)
    await card2.locator('[id^="planned-topic-"]').click();
    await page
      .locator("[cmdk-item]")
      .filter({ hasText: "เยี่ยมเยียนสร้างความสัมพันธ์" })
      .first()
      .click();

    // กรอกรายละเอียดเพิ่มเติม (ลำดับที่ 2)
    await card2
      .getByPlaceholder("ระบุรายละเอียดเพิ่มเติมการเข้าพบ...")
      .fill("ติดตามความพึงพอใจและเยี่ยมเยียนเกษตรกรในพื้นที่");

    // --- เป้าหมายลำดับที่ 3: ร้านค้า (ตัวแทนจำหน่าย / ร้านค้าย่อย) ---
    await page.getByRole("button", { name: /เพิ่มเป้าหมายเข้าพบ/ }).click();

    const card3 = page
      .locator("div.rounded-xl.border")
      .filter({ hasText: "ลำดับที่ 3" })
      .first();
    await expect(card3).toBeVisible();

    // สลับ Toggle เป็น "ร้านค้า"
    await card3.getByRole("button", { name: "ร้านค้า", exact: true }).click();

    // เลือกร้านค้า (ตัวแทนจำหน่าย / ร้านค้าย่อย)
    const storeTrigger3 = card3
      .getByRole("combobox")
      .filter({ hasText: /เลือกร้านค้า/ })
      .first();
    await expect(storeTrigger3).toBeEnabled({ timeout: 10000 });
    await storeTrigger3.click();

    const storeItems = page.locator("[cmdk-item]");
    if ((await storeItems.count()) > 0) {
      await storeItems.first().click();
    } else {
      await page.keyboard.press("Escape");
    }

    // เลือกประเด็นหลัก (ลำดับที่ 3)
    await card3.locator('[id^="planned-topic-"]').click();
    await page
      .locator("[cmdk-item]")
      .filter({ hasText: "วางแผนการขาย" })
      .first()
      .click();

    // กรอกรายละเอียดเพิ่มเติม (ลำดับที่ 3)
    await card3
      .getByPlaceholder("ระบุรายละเอียดเพิ่มเติมการเข้าพบ...")
      .fill("เข้าพบร้านค้าตัวแทนจำหน่ายเพื่อวางแผนเป้าหมายการขายประจำเดือน");

    // ─── 3. งบประมาณและค่าใช้จ่าย (PlanBudgetSection) ───
    // 3.1 เปิดใช้งาน "สื่อส่งเสริมการขาย"
    await page.getByRole("button", { name: "สื่อส่งเสริมการขาย" }).click();

    // แถวที่ 1: เลือกหมวดหมู่เป็น "อื่นๆ" เพื่อทดสอบกรอก ชื่อรายการ, หน่วย, ราคา, และจำนวน ให้ครบทุกช่อง
    const firstCategoryCombobox = page
      .locator('[id^="category-combobox-"]')
      .first();
    await expect(firstCategoryCombobox).toBeVisible();
    await firstCategoryCombobox.click();
    await page
      .locator("[cmdk-item]")
      .filter({ hasText: "อื่นๆ" })
      .first()
      .click();

    // กรอกชื่อรายการสื่อส่งเสริมการขาย
    const customProductInput = page
      .getByPlaceholder("ระบุชื่อรายการ...")
      .first();
    await customProductInput.fill("ป้ายไวนิลโปรโมชั่นพิเศษตราปืนใหญ่");

    // เลือกหน่วย
    const unitSelect = page.locator("table select").first();
    await unitSelect.selectOption("ผืน");

    // กรอกราคาต่อหน่วย และ จำนวน
    const marketingRow1Inputs = page
      .locator("table")
      .first()
      .locator("tbody tr")
      .first()
      .locator('input[type="number"]');
    await marketingRow1Inputs.nth(0).fill("450"); // ราคา
    await marketingRow1Inputs.nth(1).fill("4"); // จำนวน

    // 3.2 เปิดใช้งาน "รายการส่งเสริมการขาย"
    await page.getByRole("button", { name: "รายการส่งเสริมการขาย" }).click();

    // กดปุ่ม "+ เพิ่มรายการ" ในการ์ดรายการส่งเสริมการขาย
    const salesPromoCard = page
      .locator("div")
      .filter({ hasText: "รายการส่งเสริมการขาย" })
      .filter({ has: page.getByRole("button", { name: /เพิ่มรายการ/ }) })
      .last();
    await salesPromoCard.getByRole("button", { name: /เพิ่มรายการ/ }).click();

    // กรอกรายละเอียดรายการส่งเสริมการขาย
    const promoDetailInput = page
      .getByPlaceholder("ระบุรายละเอียดรายการ...")
      .first();
    await promoDetailInput.fill("ค่าอาหารและเครื่องดื่มรับรองลูกค้าและเกษตรกร");

    // กรอกจำนวนเงิน (บาท)
    const promoAmountInput = page.getByPlaceholder("0").first();
    await promoAmountInput.fill("2500");

    // เลือกการใช้งบ (งบการตลาด / งบขาย)
    const budgetTypeCombobox = page
      .locator('[id^="budget-type-combobox-"]')
      .first();
    await budgetTypeCombobox.click();
    await page
      .locator("[cmdk-item]")
      .filter({ hasText: "งบการตลาด" })
      .first()
      .click();

    // ─── 4. ข้อมูลเพิ่มเติม / หมายเหตุ (PlanNotesCard) ───
    const notesTextarea = page.getByPlaceholder("ข้อมูลเพิ่มเติมอื่นๆ...");
    await notesTextarea.fill(
      "หมายเหตุทดสอบอัตโนมัติด้วย Playwright: กรอกข้อมูลครบทุกช่องสำหรับแผนงาน Type 1 เรียบร้อยแล้ว",
    );
    await expect(notesTextarea).toHaveValue(
      "หมายเหตุทดสอบอัตโนมัติด้วย Playwright: กรอกข้อมูลครบทุกช่องสำหรับแผนงาน Type 1 เรียบร้อยแล้ว",
    );

    // ─── 5. ตรวจสอบปุ่มบันทึก Trip Plan พร้อมใช้งาน ───
    const submitBtn = page.getByRole("button", { name: /บันทึก Trip Plan/i });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    // หมายเหตุ: หากต้องการให้กดบันทึกจริงลงฐานข้อมูล สามารถเปิดบรรทัดด้านล่างนี้ได้
    // await submitBtn.click();
  });
});

