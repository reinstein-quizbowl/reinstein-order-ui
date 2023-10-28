import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useErrorBoundary } from 'react-error-boundary'
import dayjs from 'dayjs'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { Add, Calculate, Close, Print } from '@mui/icons-material'
import validator from 'validator'

import BookingConferencePackets from './BookingConferencePackets'
import BookingConferenceSchools from './BookingConferenceSchools'
import Api from '../api/Api'
import InvoiceLinesTable from '../invoice/InvoiceLinesTable'
import { ALL_STATUSES, AUTHORITIES } from '../util/bookingUtil'
import { SENTINEL_NULL_DATE, formatMoney, groupById, setStatePromise, bySequence, byYearCodeAndNumber } from '../util/util'
import SimpleDisplayOrEditDialog from '../util-components/SimpleDisplayOrEditDialog'
import Loading from '../util-components/Loading'
import LoadingOverlay from '../util-components/LoadingOverlay'
import SchoolPicker from '../util-components/SchoolPicker'

const Booking = (props) => {
    const params = useParams()
    const navigate = useNavigate()
    const { showBoundary: handleError } = useErrorBoundary()

    return <BookingImpl creationId={params.creationId} onError={handleError} navigate={navigate} {...props} />
}

Booking.propTypes = {}

class BookingImpl extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            booking: null,
            schoolsById: null,
            packetsById: null,
            stateSeriesById: null,
            compilationsById: null,

            schoolId: null,
            name: '',
            emailAddress: '',
            authority: '',
            statusCode: null,
            shipDate: null,
            paymentReceivedDate: null,
            internalNote: '',

            conference: null,

            practiceStateSeriesIds: null,
            practicePacketIds: null,
            practiceCompilationIds: null,
            modifiedPracticeMaterial: false,

            confirmingDelete: false,
            showError: false,
            saving: false,
        }
    }

    componentDidMount() {
        this.loadBooking()
        this.loadSchools()
        this.loadPackets()
        this.loadStateSeries()
        this.loadCompilations()
        document.title = 'Edit Order \u2013 Reinstein QuizBowl'
    }

    loadBooking = async () => {
        const { creationId } = this.props

        const booking = await Api.get(`/bookings/${creationId}`)
        await setStatePromise(this, {
            booking,
            schoolId: booking.school ? booking.school.id : null,
            name: booking.name || '',
            emailAddress: booking.emailAddress || '',
            authority: booking.authority || '',
            statusCode: booking.statusCode,
            shipDate: booking.shipDate ? dayjs(booking.shipDate) : null,
            paymentReceivedDate: booking.paymentReceivedDate ? dayjs(booking.paymentReceivedDate) : null,
            internalNote: booking.internalNote || '',
            conference: booking.conference,
            practiceStateSeriesIds: booking.stateSeriesOrders.map(it => it.stateSeries.id),
            practicePacketIds: booking.packetOrders.map(it => it.packet.id),
            practiceCompilationIds: booking.compilationOrders.map(it => it.compilation.id),
        })
    }

    loadSchools = async () => {
        const schools = await Api.get('/schools')
        this.setState({ schoolsById: groupById(schools) })
    }

    loadPackets = async () => {
        const packets = await Api.get('/packets')
        this.setState({ packetsById: groupById(packets) })
    }

    loadStateSeries = async () => {
        const stateSeries = await Api.get('/stateSeries')
        this.setState({ stateSeriesById: groupById(stateSeries) })
    }

    loadCompilations = async () => {
        const compilations = await Api.get('/compilations')
        this.setState({ compilationsById: groupById(compilations) })
    }

    startConfirmDelete = () => this.setState({ confirmingDelete: true })

    closeConfirmDelete = () => this.setState({ confirmingDelete: false })

    handleConferenceUpdate = conference => this.setState({ conference })

    handleSubmit = async (e) => {
        e.preventDefault()

        const { onError } = this.props
        const {
            booking, schoolsById,
            schoolId, name, emailAddress, authority, statusCode, shipDate, paymentReceivedDate, internalNote,
            conference,
            practiceStateSeriesIds, practicePacketIds, practiceCompilationIds, modifiedPracticeMaterial,
        } = this.state
        
        const error = this.determineError()
        if (error) {
            this.setState({ showError: true })
        } else {
            await setStatePromise(this, { saving: true })

            const payload = {
                school: schoolsById[schoolId],
                name,
                emailAddress,
                authority,
                statusCode,
                shipDate: shipDate || SENTINEL_NULL_DATE ,
                paymentReceivedDate: paymentReceivedDate || SENTINEL_NULL_DATE,
                internalNote,
            }
            let updated = await Api.post(`/bookings/${booking.creationId}`, payload, onError)

            if (booking.conference && !conference) {
                await Api.delete(`/bookings/${booking.creationId}/conference`)
                updated = await Api.get(`/bookings/${booking.creationId}`)
            } else if (conference && conference.modified) {
                updated = await Api.post(`/bookings/${booking.creationId}/conference`, conference)
            }

            if (modifiedPracticeMaterial) {
                const promises = [
                    Api.post(`/bookings/${booking.creationId}/stateSeries`, practiceStateSeriesIds, onError),
                    Api.post(`/bookings/${booking.creationId}/practicePackets`, practicePacketIds, onError),
                    Api.post(`/bookings/${booking.creationId}/practiceCompilations`, practiceCompilationIds, onError),
                ]
                await Promise.all(promises)
                updated = await Api.get(`/bookings/${booking.creationId}`)
            }

            await setStatePromise(this, { booking: updated, saving: false, modifiedPracticeMaterial: false })
        }
    }

    handleDelete = async () => {
        const { navigate } = this.props
        const { booking } = this.state

        await setStatePromise(this, { saving: true })

        await Api.delete(`/bookings/${booking.creationId}`)

        navigate('/admin/order')
    }

    recalculateInvoice = async () => {
        const { booking } = this.state

        await setStatePromise(this, { saving: true }) // not literally, but the busy indicator is useful

        const updated = await Api.post(`/bookings/${booking.creationId}/recalculateInvoice`)

        await setStatePromise(this, { booking: updated, saving: false })
    }

    resendConfirmation = async () => {
        const { booking } = this.state

        await setStatePromise(this, { saving: true }) // not literally, but the busy indicator is useful

        await Api.post(`/bookings/${booking.creationId}/confirm`)

        await setStatePromise(this, { saving: false })

        alert('The confirmation emails (both internal and external) have been re-sent.')
    }

    determineError = () => {
        // There isn't actually anything to check here, but I'm leaving the structure for ease of expansion

        return null
    }

    renderConference() {
        const { booking, conference, packetsById, schoolsById } = this.state

        if (!conference) {
            if (booking.conference) {
                return <p>The conference will be deleted when you save changes.</p>
            } else {
                return (
                    <>
                        <p>This order does not involve a conference.</p>
                    </>
                )
            }
        }

        return (
            <>
                <SimpleDisplayOrEditDialog
                    id="conferenceName"
                    displayFieldName="Name"
                    displayValue={conference.name}
                    dialogTitle="Edit conference name"
                    editWidget={
                        <TextField
                            name="conferenceName"
                            inputProps={{ className: 'input' }}
                            required
                            fullWidth
                        />
                    }
                    initialValue={conference.name}
                    onSubmit={newValue => this.setState(prevState => ({ conference: Object.assign({}, prevState.conference, { name: newValue, modified: true }) }))}
                />

                <BookingConferenceSchools
                    conference={conference}
                    ordererSchool={booking.school}
                    schoolsById={schoolsById}
                    onSubmit={schoolIds => this.setState(prevState => ({ conference: Object.assign({}, prevState.conference, { schoolIds, modified: true }) }))}
                />
                
                <BookingConferencePackets
                    conference={conference}
                    packetsById={packetsById}
                    onSubmit={(packetsRequested, assignedPackets) => this.setState(prevState => ({ conference: Object.assign({}, prevState.conference, { packetsRequested, assignedPackets, modified: true }) }))}
                />
            </>
        )
    }

    renderNonConferenceGames = (nonConferenceGames) => {
        const { schoolsById } = this.state

        if (nonConferenceGames && nonConferenceGames.length > 0) {
            return (
                <dl>
                    {nonConferenceGames.map(game => (
                        <div key={game.id}>
                            <dt>{game.assignedPacket ? `${game.assignedPacket.name}` : <span className="form-error">Packet TBD</span>}</dt>
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

    renderPracticeMaterial = () => {
        const { packetsById, stateSeriesById, compilationsById, practiceStateSeriesIds, practicePacketIds, practiceCompilationIds } = this.state

        if (practiceStateSeriesIds.length > 0 || practicePacketIds.length > 0 || practiceCompilationIds.length > 0) {
            const practiceStateSeries = practiceStateSeriesIds.map(id => stateSeriesById[id]).sort(bySequence)
            const practicePackets = practicePacketIds.map(id => packetsById[id]).sort(byYearCodeAndNumber)
            const practiceCompilations = practiceCompilationIds.map(id => compilationsById[id]).sort(bySequence)

            return (
                <ul>
                    {practiceStateSeries.map(it => <li key={`ss-${it.id}`}>{it.name} {this.renderPracticeMaterialDeleteButton('practiceStateSeriesIds', it.id)}</li>)}
                    {practicePackets.map(it => <li key={`p-${it.id}`}>{it.name} {this.renderPracticeMaterialDeleteButton('practicePacketIds', it.id)}</li>)}
                    {practiceCompilations.map(it => <li key={`c-${it.id}`}>{it.name} compilation {this.renderPracticeMaterialDeleteButton('practiceCompilationIds', it.id)}</li>)}
                </ul>
            )
        } else {
            return <p>This order does not involve practice material.</p>
        }
    }

    renderPracticeMaterialDeleteButton = (stateKey, id) => {
        return (
            <Tooltip title="Remove item">
                <IconButton size="small" onClick={() => this.removePracticeMaterialItem(stateKey, id)}>
                    <Close />
                </IconButton>
            </Tooltip>
        )
    }

    removePracticeMaterialItem = (stateKey, id) => this.setState(prevState => ({
        [stateKey]: prevState[stateKey].filter(it => it !== id),
        modifiedPracticeMaterial: true,
    }))

    render() {
        const {
            booking,
            schoolId, name, emailAddress, authority, statusCode, shipDate, paymentReceivedDate, internalNote,
            conference,
            confirmingDelete, showError, saving,
            schoolsById, packetsById, stateSeriesById, compilationsById,
        } = this.state
        if (!booking || !schoolsById || !packetsById || !stateSeriesById || !compilationsById) return <Loading />

        const basicData = [
            { key: 'ID (internal)', value: booking.creationId },
            { key: 'Submitted', value: dayjs(booking.createdAt).format('MMMM D, YYYY') },
            { key: 'Invoice', value: <><Link to={`/order/${booking.creationId}/invoice`}>{booking.invoiceLabel}</Link>{booking.requestsW9 && ' (requests W-9)'}</> },
            { key: 'Total cost', value: formatMoney(booking.cost, true) },
        ]
        if (booking.externalNote) {
            basicData.push({ key: 'Note from customer', value: booking.externalNote })
        }

        const error = this.determineError()

        const selectedSchool = schoolsById[schoolId]

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

                    <SimpleDisplayOrEditDialog
                        id="school"
                        displayFieldName="School"
                        displayValue={selectedSchool ? `${selectedSchool.shortName} (${selectedSchool.name}, ${selectedSchool.city}, ${selectedSchool.state})` : 'None'}
                        dialogTitle="Edit school"
                        editWidget={
                            <SchoolPicker
                                id="school"
                                schools={Object.values(schoolsById)}
                                placeholder="Choose school&hellip;"
                                onChange={() => null} // will be filled in by SimpleDisplayOrEditDialog, but the proptype is required
                            />
                        }
                        initialValue={schoolId}
                        onSubmit={newValue => this.setState({ schoolId: newValue })}
                    />

                    <SimpleDisplayOrEditDialog
                        id="name"
                        displayFieldName="Orderer name"
                        displayValue={name}
                        dialogTitle="Edit orderer name"
                        editWidget={
                            <TextField
                                name="name"
                                inputProps={{ className: 'input' }}
                                required
                                fullWidth
                            />
                        }
                        initialValue={name}
                        onSubmit={newValue => this.setState({ name: newValue })}
                    />

                    <SimpleDisplayOrEditDialog
                        id="emailAddress"
                        displayFieldName="Orderer email address"
                        displayValue={emailAddress}
                        dialogTitle="Edit orderer email address"
                        editWidget={
                            <TextField
                                name="emailAddress"
                                type="email"
                                inputProps={{ className: 'input' }}
                                required
                                fullWidth
                            />
                        }
                        initialValue={emailAddress}
                        validator={value => validator.isEmail(value) ? '' : 'Not a valid email address'}
                        onSubmit={newValue => this.setState({ emailAddress: newValue })}
                    />

                    <SimpleDisplayOrEditDialog
                        id="authority"
                        displayFieldName="Authority"
                        displayValue={authority}
                        dialogTitle="Edit authority"
                        editWidget={
                            <Select fullWidth>
                                {Object.keys(AUTHORITIES).map(code => <MenuItem key={code} value={AUTHORITIES[code]}>{AUTHORITIES[code]}</MenuItem>)}
                            </Select>
                        }
                        initialValue={authority}
                        onSubmit={newValue => this.setState({ authority: newValue })}
                    />

                    <SimpleDisplayOrEditDialog
                        id="status"
                        displayFieldName="Status"
                        displayValue={ALL_STATUSES.find(status => status.code === statusCode).label}
                        dialogTitle="Edit status"
                        editWidget={
                            <Select fullWidth>
                                {ALL_STATUSES.map(status => <MenuItem key={status.code} value={status.code}>{status.label}</MenuItem>)}
                            </Select>
                        }
                        initialValue={statusCode}
                        onSubmit={newValue => this.setState({ statusCode: newValue })}
                    />

                    <SimpleDisplayOrEditDialog
                        id="shipDate"
                        displayFieldName="Shipped on"
                        displayValue={shipDate ? dayjs(shipDate).format('MMMM D, YYYY') : '[not yet]'}
                        dialogTitle="Edit shipped-on date"
                        editWidget={<DatePicker className="date-field" />}
                        initialValue={shipDate}
                        onSubmit={newValue => this.setState({ shipDate: newValue })}
                    />

                    <SimpleDisplayOrEditDialog
                        id="paymentReceived"
                        displayFieldName="Payment received on"
                        displayValue={paymentReceivedDate ? dayjs(paymentReceivedDate).format('MMMM D, YYYY') : '[not yet]'}
                        dialogTitle="Edit payment-received date"
                        editWidget={<DatePicker className="date-field" />}
                        initialValue={paymentReceivedDate}
                        onSubmit={newValue => this.setState({ paymentReceivedDate: newValue })}
                    />

                    <SimpleDisplayOrEditDialog
                        id="internalNote"
                        displayFieldName="Internal note"
                        displayValue={<span className="preserve-whitespace">{internalNote || '[none]'}</span>}
                        dialogTitle="Edit internal note"
                        editWidget={
                            <TextField
                                name="internalNote"
                                inputProps={{ className: 'input' }}
                                required
                                fullWidth
                                multiline
                            />
                        }
                        initialValue={internalNote}
                        onSubmit={newValue => this.setState({ internalNote: newValue })}
                    />
                </section>

                <section id="conference">
                    <div className="display-or-edit-container-outer">
                        <h2 className="display-or-edit-container-inner">Conference</h2>
                        
                        {conference ? (
                            <Tooltip title="Remove conference">
                                <IconButton size="small" onClick={() => this.setState({ conference: null })}>
                                    <Close />
                                </IconButton>
                            </Tooltip>
                        ) : (
                            <Tooltip title="Add conference">
                                <IconButton size="small" onClick={() => this.setState({ conference: { name: '', packetsRequested: 0, schoolIds: [], assignedPackets: [] } })}>
                                    <Add />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>

                    {this.renderConference()}
                </section>

                <section id="non-conference">
                    <h2>Non-Conference Games</h2>

                    {this.renderNonConferenceGames(booking.nonConferenceGames)}
                </section>

                <section id="practice-material">
                    <h2>Practice Material</h2>

                    {this.renderPracticeMaterial()}
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
                    
                    {'\u00a0\u00a0\u00a0\u00a0'}

                    <Button
                        type="button"
                        onClick={this.resendConfirmation}
                        variant="outlined"
                    >
                        Re-Send Confirmation Emails
                    </Button>
                    
                    {'\u00a0\u00a0\u00a0\u00a0'}

                    <Button
                        type="button"
                        variant="outlined"
                        onClick={this.startConfirmDelete}
                        color="warning"
                    >
                        Delete
                    </Button>
                </p>
                
                <section id="invoice">
                <div className="display-or-edit-container-outer">
                    <h2 className="display-or-edit-container-inner">Invoice</h2>
                    <div>
                        <Tooltip title={booking.invoiceLines && booking.invoiceLines.length > 0 ? 'Recalculate invoice' : 'Calculate invoice'}>
                            <IconButton onClick={this.recalculateInvoice}>
                                <Calculate />
                            </IconButton>
                        </Tooltip>
                        {booking.invoiceLines && booking.invoiceLines.length > 0 && (
                            <Tooltip title="View printable invoice">
                                <IconButton component={Link} to={`/order/${booking.creationId}/invoice`}>
                                    <Print />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                </div>

                    {booking.invoiceLines && booking.invoiceLines.length > 0 ?
                        <InvoiceLinesTable lines={booking.invoiceLines} /> :
                        <p className="form-error">None</p>
                    }
                </section>

                <Dialog open={confirmingDelete} onClose={this.closeConfirmDelete}>
                    <DialogTitle>Delete order</DialogTitle>
                    <DialogContent>
                        <p>Are you sure you want to delete this booking?</p>
                        <p>If you go ahead with deletion, this order will be impossible to recover. This could have effects on question security and many other things. It&rsquo;s entirely your responsibility to make sure you know what you&rsquo;re doing.</p>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="outlined" onClick={this.closeConfirmDelete}>Never mind</Button>
                        <Button
                            variant="contained"
                            onClick={this.handleDelete}
                            color="warning"
                        >
                            Yes, delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </form>
        )
    }
}

export default Booking
