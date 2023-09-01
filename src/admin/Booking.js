import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useErrorBoundary } from 'react-error-boundary'
import dayjs from 'dayjs'

import { Button, FormControl, FormLabel, MenuItem, Select, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

import Api from '../api/Api'
import InvoiceLinesTable from '../invoice/InvoiceLinesTable'
import { ALL_STATUSES } from '../util/bookingUtil'
import { SENTINEL_NULL_DATE, formatMoney, setStatePromise } from '../util/util'
import Loading from '../util-components/Loading'
import LoadingOverlay from '../util-components/LoadingOverlay'

const Booking = (props) => {
    const params = useParams()
    const { showBoundary: handleError } = useErrorBoundary()

    return <BookingImpl creationId={params.creationId} onError={handleError} {...props} />
}

class BookingImpl extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            booking: null,
            schoolsById: null,

            statusCode: null,
            shipDate: null,
            paymentReceivedDate: null,
            internalNote: '',
            showError: false,
            saving: false,
        }
    }

    componentDidMount() {
        this.loadBooking()
        this.loadSchools()
        document.title = 'Edit Order \u2013 Reinstein QuizBowl'
    }

    loadBooking = async () => {
        const { creationId } = this.props

        const booking = await Api.get(`/bookings/${creationId}`)
        await setStatePromise(this, {
            booking,
            statusCode: booking.statusCode,
            shipDate: booking.shipDate ? dayjs(booking.shipDate) : null,
            paymentReceivedDate: booking.paymentReceivedDate ? dayjs(booking.paymentReceivedDate) : null,
            internalNote: booking.internalNote || '',
        })
    }

    loadSchools = async () => {
        const schools = await Api.get('/schools')

        const schoolsById = {}
        for (const school of schools) {
            schoolsById[school.id] = school
        }

        this.setState({ schoolsById })
    }

    handleTextFieldChange = e => this.setState({ [e.target.name]: e.target.value })

    handleShipDateFieldChange = shipDate => this.setState({ shipDate })

    handlePaymentReceivedDateFieldChange = paymentReceivedDate => this.setState({ paymentReceivedDate })

    handleStatusChange = event => this.setState({ statusCode: event.target.value })

    handleSubmit = async (e) => {
        e.preventDefault()

        const { onError } = this.props
        const { booking, statusCode, shipDate, paymentReceivedDate, internalNote } = this.state
        
        const error = this.determineError()
        if (error) {
            this.setState({ showError: true })
        } else {
            await setStatePromise(this, { saving: true })

            const payload = {
                statusCode,
                shipDate: shipDate || SENTINEL_NULL_DATE ,
                paymentReceivedDate: paymentReceivedDate || SENTINEL_NULL_DATE,
                internalNote,
            }
    
            const updated = await Api.post(`/bookings/${booking.creationId}`, payload, onError)
            await setStatePromise(this, { booking: updated, saving: false })
        }
    }

    determineError = () => {
        // There isn't actually anything to check here, but I'm leaving the structure for ease of expansion

        return null
    }

    renderConference = (conference) => {
        const { schoolsById } = this.state
        
        if (conference) {
            return (
                <dl>
                    <div>
                        <dt>Name</dt>
                        <dd>{conference.name}</dd>
                    </div>
                    <div>
                        <dt>Schools</dt>
                        <dd>
                            <ul>
                                {conference.schoolIds.map(id => <li key={id}>{schoolsById[id].shortName}</li>)}
                            </ul>
                        </dd>
                    </div>
                    <div>
                        <dt>Packets</dt>
                        <dd>
                            <ul>
                                {conference.assignedPackets.length === 0 && <li className="form-error">Not assigned</li>}
                                {conference.assignedPackets.map(packet => <li key={packet.id}>{packet.yearCode} packet {packet.number}</li>)}
                            </ul>
                        </dd>
                    </div>
                </dl>
            )
        } else {
            return <p>This order does not involve a conference.</p>
        }
    }

    renderNonConferenceGames = (nonConferenceGames) => {
        const { schoolsById } = this.state

        if (nonConferenceGames && nonConferenceGames.length > 0) {
            return (
                <dl>
                    {nonConferenceGames.map(game => (
                        <div key={game.id}>
                            <dt>{game.assignedPacket ? `${game.assignedPacket.yearCode} packet ${game.assignedPacket.number}` : <span class="form-error">Packet TBD</span>}</dt>
                            <dd>
                                <ul>
                                    {game.schoolIds.map(id => <li key={id}>{schoolsById[id].shortName}</li>)}
                                </ul>
                            </dd>
                        </div>
                    ))}
                </dl>
            )
        } else {
            return <p>This order does not involve non-conference games.</p>
        }
    }

    renderPracticeMaterial = (stateSeriesOrders, packetOrders, compilationOrders) => {
        if (stateSeriesOrders.length > 0 || packetOrders.length > 0 || compilationOrders.length > 0) {
            return (
                <dl>
                    {stateSeriesOrders.length > 0 && (
                        <div>
                            <dt>State Series</dt>
                            <dd>
                                <ul>
                                    {stateSeriesOrders.map(ss => <li key={`ss-${ss.id}`}>{ss.stateSeries.name}</li>)}
                                </ul>
                            </dd>
                        </div>
                    )}
                    {packetOrders.length > 0 && (
                        <div>
                            <dt>Regular-Season Packets</dt>
                            <dd>
                                <ul>
                                    {packetOrders.map(p => <li key={`p-${p.id}`}>{p.packet.yearCode} packet {p.packet.number}</li>)}
                                </ul>
                            </dd>
                        </div>
                    )}
                    {packetOrders.length > 0 && (
                        <div>
                            <dt>Regular-Season Packets</dt>
                            <dd>
                                <ul>
                                    {compilationOrders.map(c => <li key={`c-${c.id}`}>{c.compilation.name}</li>)}
                                </ul>
                            </dd>
                        </div>
                    )}
                </dl>
            )
        } else {
            return <p>This order does not involve practice material.</p>
        }
    }

    render() {
        const { booking, schoolsById, statusCode, shipDate, paymentReceivedDate, internalNote, showError, saving } = this.state
        if (!booking || !schoolsById) return <Loading />

        const basicData = [
            { key: 'ID (internal)', value: booking.creationId },
            { key: 'Submitted', value: dayjs(booking.createdAt).format('M/D/YY') },
            { key: 'Orderer school', value: `${booking.school.shortName} (${booking.school.city}, ${booking.school.state})` },
            { key: 'Orderer name', value: booking.name },
            { key: 'Orderer authority', value: booking.authority },
            { key: 'Orderer email address', value: <a href={`mailto:${booking.emailAddress}`}>{booking.emailAddress}</a> },
            { key: 'Invoice', value: <><Link to={`/order/${booking.creationId}/invoice`}>{booking.invoiceLabel}</Link>{booking.requestsW9 && ' (requests W-9)'}</> },
            { key: 'Total cost', value: formatMoney(booking.cost, true) },
        ]
        if (booking.externalNote) {
            basicData.push({ key: 'Note from customer', value: booking.externalNote })
        }

        const error = this.determineError()

        return (
            <form onSubmit={this.handleSubmit}>
                {saving && <LoadingOverlay />}
                <section id="basic">
                    <h2>Basic Data</h2>
                    
                    <dl className="booking-data">
                        {basicData.map(datum => (
                            <div key={datum.key}>
                                <dt>{datum.key}</dt>
                                <dd>{datum.value}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="statusLabel" htmlFor="status" required>
                                Status
                            </FormLabel>
                            <Select
                                labelId="statusLabel"
                                id="status"
                                value={statusCode}
                                onChange={this.handleStatusChange}
                                size="small"
                            >
                                {ALL_STATUSES.map(status => <MenuItem key={status.code} value={status.code}>{status.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </div>

                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="shipDateLabel" htmlFor="shipDate">
                                Shipped on
                            </FormLabel>
                            <DatePicker
                                id="shipDate"
                                aria-labelledby="shipDateLabel"
                                value={shipDate}
                                onChange={this.handleShipDateFieldChange}
                                className="date-field"
                            />
                        </FormControl>
                    </div>

                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="paymentReceivedDateLabel" htmlFor="paymentReceived">
                                Payment received on
                            </FormLabel>
                            <DatePicker
                                id="paymentReceivedDate"
                                aria-labelledby="paymentReceivedDateLabel"
                                value={paymentReceivedDate}
                                onChange={this.handlePaymentReceivedDateFieldChange}
                                className="date-field"
                            />
                        </FormControl>
                    </div>

                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="internalNoteLabel" htmlFor="internalNote">
                                Internal note
                            </FormLabel>
                            <TextField
                                aria-labelledby="internalNoteLabel"
                                id="internalNote"
                                name="internalNote"
                                value={internalNote}
                                onChange={this.handleTextFieldChange}
                                inputProps={{ className: 'input' }}
                                required
                                fullWidth
                                multiline
                            />
                        </FormControl>
                    </div>
                </section>

                {showError && <p className="form-error">{error}</p>}

                <p className="form-submit-container">
                    <Button
                        type="submit"
                        onClick={this.handleSubmit}
                        variant="contained"
                        disabled={showError && !!error}
                    >
                        Save
                    </Button>
                </p>

                <section id="conference">
                    <h2>Conference</h2>

                    {this.renderConference(booking.conference)}
                </section>

                <section id="non-conference">
                    <h2>Non-Conference Games</h2>

                    {this.renderNonConferenceGames(booking.nonConferenceGames)}
                </section>

                <section id="practice-material">
                    <h2>Practice Material</h2>

                    {this.renderPracticeMaterial(booking.stateSeriesOrders, booking.packetOrders, booking.compilationOrders)}
                </section>
                
                <section id="invoice">
                    <h2>
                        Invoice
                        <Button component={Link} to={`/order/${booking.creationId}/invoice`}>View printable</Button>
                    </h2>

                    {booking.invoiceLines && booking.invoiceLines.length > 0 ?
                        <InvoiceLinesTable lines={booking.invoiceLines} /> :
                        <p className="form-error">None</p>
                    }
                </section>
            </form>
        )
    }
}

export default Booking
