import React from 'react'

import { useParams } from 'react-router-dom'
import { useErrorBoundary } from 'react-error-boundary'

import dayjs from 'dayjs'

import InvoiceLinesTable from './InvoiceLinesTable'
import Api from '../api/Api'
import { setStatePromise } from '../util/util'
import Loading from '../util-components/Loading'
import Mailto from '../util-components/Mailto'

const STATUSES_FOR_WHICH_INVOICE_CAN_BE_DISPLAYED = ['submitted', 'approved', 'shipped']

const InvoicePage = (props) => {
    const params = useParams()
    const { showBoundary: handleError } = useErrorBoundary()

    return <InvoicePageImpl creationId={params.creationId} onError={handleError} {...props} />
}

InvoicePage.propTypes = {}

class InvoicePageImpl extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            booking: null,
        }
    }

    async componentDidMount() {
        const { creationId, onError } = this.props
        if (creationId) {
            const booking = await Api.get(`/bookings/${creationId}`, onError)
            await setStatePromise(this, { booking })
        }

        document.title = 'Invoice \u2013 Reinstein QuizBowl'
    }

    render() {
        const { booking } = this.state
        if (!booking) return <Loading />

        if (!STATUSES_FOR_WHICH_INVOICE_CAN_BE_DISPLAYED.includes(booking.statusCode)) {
            return <p>This invoice is not available.</p>
        }

        return (
            <>
                <p>Thank you for your order!</p>

                <p>
                    <strong>School:</strong> {booking.school.name}
                    <br />
                    <strong>Placed by:</strong> {booking.name}
                    <br />
                    <strong>Order Number:</strong> {booking.invoiceLabel}
                    <br />
                    <strong>Date:</strong> {dayjs(booking.createdAt).format('dddd, MMMM D, YYYY')}
                </p>

                <InvoiceLinesTable lines={booking.invoiceLines} bookingCreationId={booking.creationId} />

                <p>Please send a check made out to <strong>Reinstein QuizBowl</strong> to&hellip;</p>
                
                <address>
                    Reinstein QuizBowl<br />
                    PO Box 57<br />
                    125 Schelter Rd<br />
                    Lincolnshire, IL 60069&ndash;0057
                </address>

                <p>If you have any questions or problems, please write to <Mailto />.</p>
            </>
        )
    }
}

export default InvoicePage
