import { formatDate } from "date-fns";
import path from "path";
import { createLogger, format, transports } from "winston";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // Include stack trace for errors
    format.printf((info) => {
      const folderName = path.basename(__dirname);
      const fileName = path.basename(__filename);
      const filePath = path.join(folderName, fileName);

      // Extract message, stack, and the rest as context
      const { level, message, stack, timestamp, ...context } = info;
      const istTimestamp = formatDate(timestamp as string, "dd-MM-yy HH:mm:ss");
      // Remove winston internal symbols if present
      const contextStr = Object.keys(context).length
        ? " " + JSON.stringify(context)
        : "";
      return `${istTimestamp} [${level}] [${filePath}]: ${stack || message}${contextStr}`;
    })
  ),
  transports: [
    new transports.File({ filename: "logs/app.log" }), // Log to file
    new transports.Console(), // Log to console
  ],
});
