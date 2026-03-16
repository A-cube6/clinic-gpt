const buildTime = new Date();

const sydney = new Date(
  buildTime.toLocaleString("en-US", { timeZone: "Australia/Sydney" })
);

const pad = (n: number) => String(n).padStart(2, "0");

export const APP_BUILD_VERSION = `${sydney.getFullYear()}-${pad(
  sydney.getMonth() + 1
)}-${pad(sydney.getDate())} ${pad(sydney.getHours())}:${pad(
  sydney.getMinutes()
)}:${pad(sydney.getSeconds())}`;