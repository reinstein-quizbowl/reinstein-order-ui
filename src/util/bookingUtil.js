export const STATUS_UNSUBMITTED = { code: 'unsubmitted', label: 'Unsubmitted', sequence: 100 }
export const STATUS_SUBMITTED = { code: 'submitted', label: 'Submitted', sequence: 200 }
export const STATUS_APPROVED = { code: 'approved', label: 'Approved', sequence: 300 }
export const STATUS_SHIPPED = { code: 'shipped', label: 'Shipped', sequence: 400 }
export const STATUS_ABANDONED = { code: 'abandoned', label: 'Abandoned', sequence: 1000 }
export const STATUS_CANCELED = { code: 'canceled', label: 'Canceled', sequence: 1100 }
export const STATUS_REJECTED = { code: 'rejected', label: 'Rejected', sequence: 1200 }
export const ALL_STATUSES = [STATUS_UNSUBMITTED, STATUS_SUBMITTED, STATUS_APPROVED, STATUS_SHIPPED, STATUS_ABANDONED, STATUS_CANCELED, STATUS_REJECTED]

export const getStatusData = (statusCode) => ALL_STATUSES.find(it => it.code === statusCode)

export const getStatusLabel = (statusCode) => {
    const status = getStatusData(statusCode)
    if (status) {
        return status.label
    } else {
        return null
    }
}

export const AUTHORITIES = {
    coach: 'they are the coach',
    coachKnows: 'the coach knows about the order',
    coachDoesntKnow: "the coach doesn't know about the order",
}
