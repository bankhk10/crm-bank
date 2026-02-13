/**
 * Test script for Force Logout functionality
 * สคริปต์ทดสอบการทำงานของระบบบังคับ logout
 */

import { invalidateAllSessions, getSessionVersion, isSessionValid } from "../lib/force-logout.service";

async function testForceLogout() {
  console.log("🧪 Testing Force Logout Functionality\n");

  try {
    // 1. Get initial session version
    console.log("1️⃣ Getting initial session version...");
    const initialVersion = await getSessionVersion();
    console.log(`   Initial version: ${initialVersion}`);

    // 2. Test session validation with current version
    console.log("\n2️⃣ Testing session validation...");
    const isValidInitial = await isSessionValid(initialVersion);
    console.log(`   Is initial version valid: ${isValidInitial}`);

    // 3. Test with invalid version
    console.log("\n3️⃣ Testing with invalid version...");
    const isValidInvalid = await isSessionValid("invalid-version-123");
    console.log(`   Is invalid version valid: ${isValidInvalid}`);

    // 4. Force invalidate all sessions
    console.log("\n4️⃣ Force invalidating all sessions...");
    await invalidateAllSessions();
    console.log("   ✅ Sessions invalidated successfully");

    // 5. Get new session version
    console.log("\n5️⃣ Getting new session version...");
    const newVersion = await getSessionVersion();
    console.log(`   New version: ${newVersion}`);

    // 6. Test old version validation
    console.log("\n6️⃣ Testing old version validation...");
    const isOldVersionValid = await isSessionValid(initialVersion);
    console.log(`   Is old version valid: ${isOldVersionValid}`);

    // 7. Test new version validation
    console.log("\n7️⃣ Testing new version validation...");
    const isNewVersionValid = await isSessionValid(newVersion);
    console.log(`   Is new version valid: ${isNewVersionValid}`);

    // Summary
    console.log("\n📊 Test Summary:");
    console.log(`   Initial version: ${initialVersion}`);
    console.log(`   New version: ${newVersion}`);
    console.log(`   Versions are different: ${initialVersion !== newVersion}`);
    console.log(`   Old version invalid: ${!isOldVersionValid}`);
    console.log(`   New version valid: ${isNewVersionValid}`);

    if (initialVersion !== newVersion && !isOldVersionValid && isNewVersionValid) {
      console.log("\n✅ All tests passed! Force logout functionality is working correctly.");
    } else {
      console.log("\n❌ Some tests failed. Please check the implementation.");
    }

  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testForceLogout();
}

export { testForceLogout };
