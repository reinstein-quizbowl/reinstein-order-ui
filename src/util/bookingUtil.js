export const STATUS_UNSUBMITTED = { code: 'unsubmitted', label: 'Unsubmitted', sequence: 1 }
export const STATUS_SUBMITTED = { code: 'submitted', label: 'Submitted', sequence: 2 }
export const STATUS_APPROVED = { code: 'approved', label: 'Approved', sequence: 3 }
export const STATUS_SHIPPED = { code: 'shipped', label: 'Shipped', sequence: 4 }
export const STATUS_CANCELED = { code: 'canceled', label: 'Canceled', sequence: 100 }
export const STATUS_REJECTED = { code: 'rejected', label: 'Rejected', sequence: 200 }
export const ALL_STATUSES = [STATUS_UNSUBMITTED, STATUS_SUBMITTED, STATUS_APPROVED, STATUS_SHIPPED, STATUS_CANCELED, STATUS_REJECTED]

export const getStatusData = (statusCode) => ALL_STATUSES.find(it => it.code === statusCode)

export const getStatusLabel = (statusCode) => {
    const status = getStatusData(statusCode)
    if (status) {
        return status.label
    } else {
        return null
    }
}
