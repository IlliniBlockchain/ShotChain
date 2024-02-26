export function formatDate(ISOdate) {
    const postdate = new Date(ISOdate)
    const now = new Date();
    const msDifference = now - postdate

    const dayDifference = Math.floor(msDifference / (1000 * 60 * 60 * 24))
    if (dayDifference != 0) return `${dayDifference} day${dayDifference != 1 ? "s" : ""} ago`

    const hrDifference = Math.floor(msDifference / (1000 * 60 * 60))
    if (hrDifference != 0) return `${hrDifference} hour${hrDifference != 1 ? "s" : ""} ago`

    const minDifference = Math.floor(msDifference / (1000 * 60))
    if (minDifference != 0) return `${minDifference} minute${minDifference != 1 ? "s" : ""} ago`

    const secDifference = Math.floor(msDifference / 1000)
    return `${secDifference} second${secDifference != 1 ? "s" : ""} ago`
}

export function formatAppDeadline(ISOdate, appDeadline) {
    const postdate = new Date(ISOdate)
    const now = new Date();
    const msDifference = now - postdate

    const daysElapsed = Math.floor(msDifference / (1000 * 60 * 60 * 24))
    if (parseFloat(appDeadline) - daysElapsed - 1 >= 1) return `Application due in ${parseInt(parseFloat(appDeadline) - daysElapsed - 1)} day${parseFloat(appDeadline) - daysElapsed - 1 == 1 ? "" : "s"}`;

    const hrsElapsed = Math.floor(msDifference / (1000 * 60 * 60))
    if (parseFloat(appDeadline) * 24 - hrsElapsed - 1 >= 1) return `Application due in ${parseInt(parseFloat(appDeadline) * 24 - hrsElapsed - 1)} hour${parseFloat(appDeadline) * 24 - hrsElapsed - 1 == 1 ? "" : "s"}`;

    const minsElapsed = Math.floor(msDifference / (1000 * 60))
    if (parseFloat(appDeadline) * 24 * 60 - minsElapsed - 1 >= 1) return `Application due in ${parseInt(parseFloat(appDeadline) * 24 * 60 - minsElapsed - 1)} minute${parseFloat(appDeadline) - minsElapsed - 1 == 1 ? "" : "s"}`;

    const secsElapsed = Math.floor(msDifference / (1000))
    if (parseFloat(appDeadline) * 24 * 60 * 60 - secsElapsed - 1 >= 1) return `Application due in ${parseInt(parseFloat(appDeadline) * 24 * 60 * 60 - secsElapsed - 1)} second${parseFloat(appDeadline) - secsElapsed - 1 == 1 ? "" : "s"}`;

    return "Application deadline passed"
}

export function formatAnsDeadline(ansDeadline) {

    const days = parseInt(parseFloat(ansDeadline))
    if (days >= 1) return `${days} day${days != 1 ? "" : ""} return time`

    const hours = parseInt(parseFloat(ansDeadline) * 24)
    if (hours >= 1) return `${hours} hour${hours != 1 ? "" : ""} return time`

    const minutes = parseInt(parseFloat(ansDeadline) * 24 * 60)
    if (minutes >= 1) return `${minutes} minute${minutes != 1 ? "" : ""} return time`

    const seconds = parseInt(parseFloat(ansDeadline) * 24 * 60 * 60)
    if (seconds >= 1) return `${seconds} second${seconds != 1 ? "" : ""} return time`

    return ""
}
