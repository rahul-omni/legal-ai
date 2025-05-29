import { formatDate } from "date-fns";
import path from "path";
import fs from "fs";
import { createLogger, format, transports } from "winston";

const loggerTransports = [];

const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
loggerTransports.push(
  new transports.File({ filename: path.join(logDir, "app.log") })
);

loggerTransports.push(new transports.Console());

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
  transports: loggerTransports,
});
