import { int, isInt, isDate, isDateTime, isTime, isLocalDateTime, isLocalTime } from 'neo4j-driver';

// Helper method to serialize records (similar to Clojure serialize-record)
export const serializeRecord = (record: any): any => {
  const serialized = {};
  for (const [key, value] of Object.entries(record)) {
    if (isInt(value)) {
      // Convert to number (be careful with large integers!)
      serialized[key] = value.toNumber();
      // Or for large integers: serialized[key] = value.toString();
    }
    else if (isDate(value)) {
      serialized[key] = value.toString(); // Returns YYYY-MM-DD
    }
    else if (isDateTime(value) || isLocalDateTime(value)) {
      serialized[key] = value.toString(); // Returns ISO format
    }
    else if (isTime(value) || isLocalTime(value)) {
      serialized[key] = value.toString();
    }
    else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    }
    else {
      serialized[key] = value;
    }
  }
  return serialized;
}

