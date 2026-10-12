export function isEvent(title: string) {
  return /^\s*\[(이벤트|EVENT)\]/i.test(title);
}

export function displayTitle(title: string) {
  return title.replace(
    /^\s*\[(공지|공지사항|NOTICE|이벤트|EVENT)\]\s*/i,
    ""
  ).trim();
}

export function displayDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
