import { createLogger, format, transports } from "winston";
import path from "path";
import { formatDate } from "date-fns";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // Include stack trace for errors
    format.printf(({ timestamp, level, message, stack }) => {
      const folderName = path.basename(__dirname);
      const fileName = path.basename(__filename);
      const filePath = path.join(folderName, fileName);

      const istTimestamp = formatDate(new Date(), "dd-MM-yy HH:mm:ss");
      return `${istTimestamp} [${level}] [${filePath}]: ${stack || message}`;
    })
  ),
  transports: [
    new transports.File({ filename: "logs/app.log" }), // Log to file
    new transports.Console(), // Log to console
  ],
});
