import React from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

import { Button, Checkbox, FormControl, FormControlLabel, FormLabel, FormGroup, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, TextField } from '@mui/material'

import Api from '../api/Api'
import Auth from '../auth/Auth'
import { ALL_STATUSES, STATUS_SUBMITTED, STATUS_APPROVED, getStatusData } from '../util/bookingUtil'
import { groupById, setStatePromise } from '../util/util'
import LoadingOverlay from '../util-components/LoadingOverlay'
import BookingSummaryRow from './BookingSummaryRow'
import DoubleBookings from './DoubleBookings'

const HEADERS = [
    { code: 'date', label: 'Date' },
    { code: 'school', label: 'School' },
    { code: 'orderer', label: 'Orderer' },
    { code: 'conference', label: 'Conference' },
    { code: 'nonConferenceGames', label: 'Add’l Games' },
    { code: 'practice', label: 'Practice' },
    { code: 'note', label: 'Note' },
    { code: 'cost', label: 'Total Cost', align: 'right' },
    { code: 'status', label: 'Status' },
]

const BookingsList = (props) => {
    const navigate = useNavigate()

    return <BookingsListImpl navigate={navigate}{...props} />
}

class BookingsListImpl extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            statusCodes: [STATUS_SUBMITTED.code, STATUS_APPROVED.code],
            includePaid: true,
            includeUnpaid: true,
            bookings: null,
            schoolsById: null,
            sortBy: null,
            sortDirection: 'asc',
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
        const { statusCodes, includePaid, includeUnpaid } = this.state

        const statusCodesParam = statusCodes.map(it => 'statusCode=' + it).join('&')

        await setStatePromise(this, { bookings: null })

        let bookings = await Api.get('/bookings?' + statusCodesParam)

        if (!includePaid) {
            bookings = bookings.filter(it => !it.paymentReceivedDate)
        }
        if (!includeUnpaid) {
            bookings = bookings.filter(it => !!it.paymentReceivedDate)
        }

        this.setState({ bookings })
    }

    toggleStateMember = key => this.setState(prevState => ({ [key]: !prevState[key] }))

    toggleStatus = statusCode => this.setState((prevState) => {
        const old = prevState.statusCodes
        if (old.includes(statusCode)) {
            return { statusCodes: old.filter(it => it !== statusCode) }
        } else {
            return { statusCodes: [statusCode, ...old] }
        }
    })

    handleLogOut = () => {
        Auth.logOut()
        this.props.navigate('/')
    }

    determineBaseComparator = () => {
        const { sortBy } = this.state

        switch (sortBy) {
            case null:
            case 'date':
                return (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
            case 'school':
                return (a, b) => a.school.shortName.localeCompare(b.school.shortName)
            case 'orderer':
                return (a, b) => a.name.localeCompare(b.name)
            case 'conference':
                return (a, b) => {
                    if (a.conference && b.conference) {
                        return a.conference.name.localeCompare(b.conference.name)
                    } else if (a.conference) {
                        return 1
                    } else if (b.conference) {
                        return -1
                    } else {
                        return 0
                    }
                }
            case 'nonConferenceGames':
                return (a, b) => a.nonConferenceGames.length - b.nonConferenceGames.length
            case 'practice':
                return (a, b) => (a.stateSeriesOrders.length + a.packetOrders.length + a.compilationOrders.length) - (b.stateSeriesOrders.length + b.packetOrders.length + b.compilationOrders.length)
            case 'note':
                return (a, b) => {
                    const aNoteCount = (!!a.internalNote ? 1 : 0) + (!!a.externalNote ? 1 : 0)
                    const bNoteCount = (!!b.internalNote ? 1 : 0) + (!!b.externalNote ? 1 : 0)
                    return aNoteCount - bNoteCount
                }
            case 'cost':
                return (a, b) => Number(a.cost) - Number(b.cost)
            case 'status':
                return (a, b) => {
                    const aStatus = getStatusData(a.statusCode)
                    const bStatus = getStatusData(b.statusCode)

                    if (aStatus && bStatus) {
                        return aStatus.sequence - bStatus.sequence
                    } else {
                        // this shouldn't happen
                        return 0
                    }
                }
            default: 
                console.warn('unknown sort by: ' + sortBy)
                return (a, b) => 0
        }
    }

    determineComparator = () => {
        const { sortDirection } = this.state

        const baseComparator = this.determineBaseComparator()

        if (sortDirection === 'desc') {
            return (a, b) => baseComparator(b, a)
        } else {
            return baseComparator
        }
    }

    handleSort = newSortBy => this.setState((prevState) => {
        const oldSortBy = prevState.sortBy
        const oldSortDirection = prevState.sortDirection

        if (newSortBy === oldSortBy) {
            if (oldSortDirection === 'desc') {
                return { sortDirection: 'asc' }
            } else {
                return { sortDirection: 'desc' }
            }
        } else {
            return {
                sortBy: newSortBy,
                sortDirection: 'asc',
            }
        }
    })

    renderStatusPicker = () => (
        <fieldset>
            <FormGroup row>
                {ALL_STATUSES.map(this.renderStatusOption)}
            </FormGroup>
            <FormGroup row>
                <FormControlLabel
                    label="Include paid orders"
                    control={<Checkbox checked={this.state.includePaid} onChange={() => this.toggleStateMember('includePaid')} />}
                    classes={{ root: 'filter-option' }}
                />
                <FormControlLabel
                    label="Include unpaid orders"
                    control={<Checkbox checked={this.state.includeUnpaid} onChange={() => this.toggleStateMember('includeUnpaid')} />}
                    classes={{ root: 'filter-option' }}
                />
            </FormGroup>
            <div>{/* prevents the <Button> from growing weirdly tall */}
                <Button onClick={this.loadBookings} variant="outlined">
                    Update Listing
                </Button>
            </div>
        </fieldset>
    )

    renderStatusOption = status => (
        <FormControlLabel
            key={status.code}
            label={status.label}
            control={<Checkbox checked={this.state.statusCodes.includes(status.code)} onChange={() => this.toggleStatus(status.code)} />}
            classes={{ root: 'filter-option' }}
        />
    )

    renderBookingRow = booking => <BookingSummaryRow key={booking.id} booking={booking} schoolsById={this.state.schoolsById} />

    renderBookings = () => {
        const { bookings, statusCodes, sortBy, sortDirection } = this.state
        if (!bookings) return null
        if (bookings.length === 0) return <p>No results for {statusCodes.length === 1 ? 'this status' : 'these statuses' }.</p>

        return (
            <Table className="invoice">
                <TableHead>
                    <TableRow>
                        {HEADERS.map(header => (
                            <TableCell
                                key={header.code}
                                align={header.align}
                                sortDirection={sortDirection}
                            >
                                <TableSortLabel
                                    active={sortBy === header.code}
                                    direction={sortDirection}
                                    onClick={() => this.handleSort(header.code)}
                                >
                                    {header.label}
                                </TableSortLabel>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bookings.sort(this.determineComparator()).map(this.renderBookingRow)}
                </TableBody>
            </Table>
        )
    }

    renderEmailAddresses = () => {
        const { bookings } = this.state
        if (!bookings) return null

        return (
            <FormControl fullWidth>
                <FormLabel id="emailsLabel" htmlFor="emails" required>
                    Email addresses for orders listed above
                </FormLabel>
                <TextField
                    aria-labelledby="emailsLabel"
                    id="emails"
                    name="emails"
                    value={bookings.map(it => it.emailAddress).join('; ')}
                    inputProps={{ className: 'input' }}
                    fullWidth
                />
            </FormControl>
        )
    }

    render() {
        const { schoolsById, bookings } = this.state

        return (
            <div>
                {(!schoolsById || !bookings) && <LoadingOverlay />}
                {this.renderStatusPicker()}
                <DoubleBookings />
                {this.renderBookings()}
                {this.renderEmailAddresses()}
                <Button onClick={this.handleLogOut}>
                    Log Out
                </Button>
            </div>
        )
    }
}

export default BookingsList
