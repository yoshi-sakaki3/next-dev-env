/** 日本時間の今日の日付（YYYY-MM-DD）。呼ぶ前に connection() でリクエスト時の処理にしておく */
export function todayInTokyo(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(now);
}
