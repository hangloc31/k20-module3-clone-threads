// Formatting helpers shared by the feed, post cards and the embed page.

const UNITS = [
  { limit: 1000, suffix: "K" },
  { limit: 1000 * 1000, suffix: "M" },
];

// 1200 -> "1.2K", 3400000 -> "3.4M", 42 -> "42"
export const formatCount = (value) => {
  const num = typeof value === "string" ? Number(value) : value;
  if (typeof num !== "number" || Number.isNaN(num)) return "0";
  if (num < 0) return "0";
  for (const { limit, suffix } of UNITS) {
    if (num >= limit) {
      const scaled = num / limit;
      return `${scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 10) / 10}${suffix}`;
    }
  }
  return `${Math.round(num)}`;
};

// Parse "3.2K" / "7.1K" / "2K" back into a number.
export const parseCount = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return 0;
  if (value.trim().endsWith("K")) return Math.round(num * 1000);
  if (value.trim().endsWith("M")) return Math.round(num * 1000000);
  return Math.round(num);
};

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

// "2h", "5 phút", "3 ngày" — Threads-style relative time in Vietnamese.
export const formatRelativeTime = (isoDate) => {
  if (!isoDate) return "";
  const created = new Date(isoDate).getTime();
  if (Number.isNaN(created)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - created) / 1000));
  if (seconds < MINUTE) return "vừa xong";
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)} phút`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)} giờ`;
  if (seconds < WEEK) return `${Math.floor(seconds / DAY)} ngày`;
  if (seconds < MONTH) return `${Math.floor(seconds / WEEK)} tuần`;
  if (seconds < YEAR) return `${Math.floor(seconds / MONTH)} tháng`;
  return `${Math.floor(seconds / YEAR)} năm`;
};

// Pull #hashtags out of a post body.
export const extractHashtags = (text) => {
  if (!text) return [];
  const matches = text.match(/#[\p{L}\p{N}_]+/gu);
  return matches ? [...new Set(matches)] : [];
};
