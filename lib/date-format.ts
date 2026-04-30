import { formatInTimeZone } from "date-fns-tz"
import { zhTW } from "date-fns/locale"

export function formatChineseDateTime(utcIso: string, timezone: string): string {
  return formatInTimeZone(new Date(utcIso), timezone, "yyyy年M月d日 a hh:mm", {
    locale: zhTW,
  }).replace(/(上午|下午)\s+/, "$1")
}

export function formatChineseDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${Number(year)}年${Number(month)}月${Number(day)}日`
}

export function formatCompactChineseDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-")
  return `${Number(month)}月${Number(day)}日`
}
