import { logger } from "@/app/api/lib/logger";
import { db } from "@/app/api/lib/db";
import { schedule } from "node-cron";

// Run daily at 3 AM
schedule("0 3 * * *", async () => {
  await db.user.updateMany({
    where: {
      verificationTokenExpiry: {
        lt: new Date(),
      },
    },
    data: {
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });
  logger.info("Cleaned expired verification tokens");
});
