/* ===== Helpers Paris week (reset dimanche 23:59 => lundi 00:00) ===== */
function _lastSundayUTC(year, monthIndex0) {
    const d = new Date(Date.UTC(year, monthIndex0 + 1, 0))
    const day = d.getUTCDay()
    d.setUTCDate(d.getUTCDate() - day)
    d.setUTCHours(0, 0, 0, 0)
    return d
}
function _isParisDST(dateUtc) {
    const y = dateUtc.getUTCFullYear()
    const start = _lastSundayUTC(y, 2); start.setUTCHours(1, 0, 0, 0) // mars 01:00 UTC
    const end = _lastSundayUTC(y, 9); end.setUTCHours(1, 0, 0, 0)   // oct  01:00 UTC
    return dateUtc >= start && dateUtc < end
}
function _parisOffsetMs(dateUtc = new Date()) {
    return _isParisDST(dateUtc) ? 2 * 3600000 : 1 * 3600000
}
function _parisNow(dateUtc = new Date()) {
    return new Date(dateUtc.getTime() + _parisOffsetMs(dateUtc))
}
/** Clé semaine: 'YYYY-MM-DD' (lundi 00:00 heure de Paris) */
export function getCurrentParisWeekKey(dateUtc = new Date()) {
    const p = _parisNow(dateUtc)
    const dow = p.getUTCDay()
    const daysSinceMonday = (dow + 6) % 7
    const monday = new Date(Date.UTC(p.getUTCFullYear(), p.getUTCMonth(), p.getUTCDate()))
    monday.setUTCDate(monday.getUTCDate() - daysSinceMonday)
    monday.setUTCHours(0, 0, 0, 0)
    const y = monday.getUTCFullYear()
    const m = String(monday.getUTCMonth() + 1).padStart(2, '0')
    const d = String(monday.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}
