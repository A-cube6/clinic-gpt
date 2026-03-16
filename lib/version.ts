export const APP_BUILD_TIME = new Intl.DateTimeFormat("en-AU", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Australia/Sydney",
}).format(new Date());