export const STATUS_UNSUBMITTED = { code: 'unsubmitted', label: 'Unsubmitted' }
export const STATUS_SUBMITTED = { code: 'submitted', label: 'Submitted' }
export const STATUS_APPROVED = { code: 'approved', label: 'Approved' }
export const STATUS_SHIPPED = { code: 'shipped', label: 'Shipped' }
export const STATUS_CANCELED = { code: 'canceled', label: 'Canceled' }
export const STATUS_REJECTED = { code: 'rejected', label: 'Rejected' }
export const ALL_STATUSES = [STATUS_UNSUBMITTED, STATUS_SUBMITTED, STATUS_APPROVED, STATUS_SHIPPED, STATUS_CANCELED, STATUS_REJECTED]

export const getStatusLabel = (statusCode) => {
    const status = ALL_STATUSES.find(it => it.code === statusCode)
    if (status) {
        return status.label
    } else {
        return null
    }
}
