export const normalizeDate = (date: Date) => {
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const dateFormat: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};
