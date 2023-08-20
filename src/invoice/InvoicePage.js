import React from 'react'

import { useParams } from 'react-router-dom'

import Invoice from './Invoice'
import Api from '../api/Api'
import Loading from '../util-components/Loading'

const STATUSES_FOR_WHICH_INVOICE_CAN_BE_DISPLAYED = ['submitted', 'approved', 'shipped']

const InvoicePage = (props) => {
    const params = useParams()

    return <InvoicePageImpl creationId={params.creationId} {...props} />
}

class InvoicePageImpl extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            booking: null,
        }
    }

    async componentDidMount() {
        const { creationId } = this.props
        if (creationId) {
            const booking = await Api.get(`/bookings/${creationId}`)
            this.setState({ booking })
        }

        document.title = 'Invoice \u2013 Reinstein QuizBowl'
    }

    render() {
        const { booking } = this.state
        if (!booking) return <Loading />

        if (!STATUSES_FOR_WHICH_INVOICE_CAN_BE_DISPLAYED.includes(booking.statusCode)) {
            return <p>This invoice is not available.</p>
        }

        return <Invoice lines={booking.invoiceLines} />
    }
}

export default InvoicePage
