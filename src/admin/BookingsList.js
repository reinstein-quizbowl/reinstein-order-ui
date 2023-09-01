import React from 'react'

import { Button, Checkbox, FormControlLabel, FormGroup, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'

import Api from '../api/Api'
import BookingSummaryRow from './BookingSummaryRow'
import { ALL_STATUSES, STATUS_SUBMITTED, STATUS_APPROVED } from '../util/bookingUtil'
import { setStatePromise } from '../util/util'
import LoadingOverlay from '../util-components/LoadingOverlay'

export default class BookingsList extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            statusCodes: [STATUS_SUBMITTED.code, STATUS_APPROVED.code],
            bookings: null,
            schoolsById: null,
        }
    }

    componentDidMount() {
        this.loadSchools()
        this.loadBookings()

        document.title = 'Orders \u2013 Reinstein QuizBowl'
    }

    loadSchools = async () => {
        const schools = await Api.get('/schools')
        this.setState({ schoolsById: groupById(schools) })
    }

    loadBookings = async () => {
        const { statusCodes } = this.state

        const statusCodesParam = statusCodes.map(it => 'statusCode=' + it).join('&')

        await setStatePromise(this, { bookings: null })

        const bookings = await Api.get('/bookings?' + statusCodesParam)
        this.setState({ bookings })
    }

    toggleStatus = statusCode => this.setState((prevState) => {
        const old = prevState.statusCodes
        if (old.includes(statusCode)) {
            return { statusCodes: old.filter(it => it !== statusCode) }
        } else {
            return { statusCodes: [statusCode, ...old] }
        }
    })

    renderStatusPicker = () => (
        <FormGroup row>
            {ALL_STATUSES.map(this.renderStatusOption)}
            <div>{/* prevents the <Button> from growing weirdly tall */}
                <Button onClick={this.loadBookings} variant="outlined">
                    Update Listing
                </Button>
            </div>
        </FormGroup>
    )

    renderStatusOption = status => (
        <FormControlLabel
            key={status.code}
            label={status.label}
            control={<Checkbox checked={this.state.statusCodes.includes(status.code)} onChange={() => this.toggleStatus(status.code)} />}
            classes={{ root: 'status-filter-option' }}
        />
    )

    renderBookings = () => {
        const { bookings, schoolsById, statusCodes } = this.state
        if (!bookings) return null
        if (bookings.length === 0) return <p>No results for {statusCodes.length === 1 ? 'this status' : 'these statuses' }.</p>

        return (
            <Table className="invoice">
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>School</TableCell>
                        <TableCell>Orderer</TableCell>
                        <TableCell>Conference</TableCell>
                        <TableCell>Add'l Games</TableCell>
                        <TableCell>Practice</TableCell>
                        <TableCell>Note</TableCell>
                        <TableCell align="right">Total Cost</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bookings.map(it => <BookingSummaryRow key={it.id} booking={it} schoolsById={schoolsById} />)}
                </TableBody>
            </Table>
        )
    }

    render() {
        const { schoolsById, bookings } = this.state

        return (
            <div>
                {(!schoolsById || !bookings) && <LoadingOverlay />}
                {this.renderStatusPicker()}
                {this.renderBookings()}
            </div>
        )
    }
}
