/**
 * One-time script to create the test/dummy user for QA login (Option A).
 * Run manually once: npm run seed:test-user
 * Not part of deploy; main seed (roles only) does not create this user.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_MOBILE = "9999999991";

async function main() {
  const existing = await prisma.user.findFirst({ where: { mobileNumber: TEST_MOBILE } });
  if (existing) {
    console.log(`Test user already exists for ${TEST_MOBILE}. Nothing to do.`);
    return;
  }
  await prisma.user.create({
    data: {
      name: "QA Tester",
      email: `tester+${TEST_MOBILE}@test.local`,
      mobileNumber: TEST_MOBILE,
      countryCode: "+91",
      isMobileVerified: true,
      isVerified: true,
    },
  });
  console.log(`Test user created for ${TEST_MOBILE}. Use OTP 123456 when ALLOW_TEST_OTP=true.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
