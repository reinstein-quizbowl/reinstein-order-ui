import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useErrorBoundary } from 'react-error-boundary'
import dayjs from 'dayjs'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListSubheader, Menu, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { Add, Calculate, Close, MoreVert, Print } from '@mui/icons-material'
import validator from 'validator'

import BookingConferencePackets from './BookingConferencePackets'
import BookingConferenceSchools from './BookingConferenceSchools'
import NonConferenceGamePacket from './NonConferenceGamePacket'
import Api from '../api/Api'
import NonConferenceGameInput from '../order/NonConferenceGameInput'
import InvoiceLinesTable from '../invoice/InvoiceLinesTable'
import { ALL_STATUSES, AUTHORITIES } from '../util/bookingUtil'
import { SENTINEL_NULL_DATE, formatMoney, groupById, setStatePromise, bySequence, byYearCodeAndNumber } from '../util/util'
import SimpleDisplayOrEditDialog from '../util-components/SimpleDisplayOrEditDialog'
import Loading from '../util-components/Loading'
import LoadingOverlay from '../util-components/LoadingOverlay'
import SchoolPicker from '../util-components/SchoolPicker'
import InvoiceLineEdit from '../invoice/InvoiceLineEdit'

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

            nonConferenceGames: null,
            unassignPacketFromNonConferenceGameIds: [],
            assignPacketForNonConferenceGameIds: [],
            nonConferenceGameMenuElt: null,
            assigningPacketForNonConferenceGameId: null,
            addingNonConferenceGame: false,

            practiceStateSeriesIds: null,
            practicePacketIds: null,
            practiceCompilationIds: null,
            addingPracticeMaterialElt: null,
            modifiedPracticeMaterial: false,

            addingInvoiceLine: false,

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
            nonConferenceGames: booking.nonConferenceGames,
            unassignPacketFromNonConferenceGameIds: [],
            assignPacketForNonConferenceGameIds: [],
            practiceStateSeriesIds: booking.stateSeriesOrders.map(it => it.stateSeries.id),
            practicePacketIds: booking.packetOrders.map(it => it.packet.id),
            practiceCompilationIds: booking.compilationOrders.map(it => it.compilation.id),
            saving: false,
            modifiedPracticeMaterial: false,
        })
    }

    loadSchools = async () => {
        const schools = await Api.get('/schools')
        this.setState({ schoolsById: groupById(schools) })
    }

    loadPackets = async () => {
        const packets = await Api.get('/packets?filter=all')
        this.setState({ packetsById: groupById(packets) })
    }

    loadStateSeries = async () => {
        const stateSeries = await Api.get('/stateSeries?filter=all')
        this.setState({ stateSeriesById: groupById(stateSeries) })
    }

    loadCompilations = async () => {
        const compilations = await Api.get('/compilations?filter=all')
        this.setState({ compilationsById: groupById(compilations) })
    }

    openNonConferenceGameMenu = e => this.setState({ nonConferenceGameMenuElt: e.currentTarget })

    closeNonConferenceGameMenu = () => this.setState({ nonConferenceGameMenuElt: null })

    startAddNonConferenceGame = () => this.setState({ addingNonConferenceGame: true })

    closeAddNonConferenceGame = () => this.setState({ addingNonConferenceGame: false })

    handleAddNonConferenceGame = newGame => this.setState(prevState => ({ nonConferenceGames: [...prevState.nonConferenceGames, newGame] }))

    startAddPracticeMaterial = e => this.setState({ addingPracticeMaterialElt: e.currentTarget })

    closeAddPracticeMaterial = () => this.setState({ addingPracticeMaterialElt: null })

    renderPracticeMaterialAddMenu = () => {
        const { addingPracticeMaterialElt } = this.state

        const { stateSeriesById, packetsById, compilationsById, practiceStateSeriesIds, practicePacketIds, practiceCompilationIds } = this.state

        const stateSeries = Object.values(stateSeriesById).sort(bySequence)
        const packets = Object.values(packetsById).sort(byYearCodeAndNumber)
        const compilations = Object.values(compilationsById).sort(bySequence)

        return (
            <Menu
                anchorEl={addingPracticeMaterialElt}
                open={!!addingPracticeMaterialElt}
                onClose={this.closeAddPracticeMaterial}
                slotProps={{ paper: { style: { maxHeight: 500 } } }}
            >
                <ListSubheader>State Series</ListSubheader>
                {stateSeries.map(ss => (
                    <MenuItem
                        key={`ss-${ss.id}`}
                        onClick={() => this.addPracticeMaterialItem('practiceStateSeriesIds', ss.id)}
                        disabled={practiceStateSeriesIds.includes(ss.id)}
                    >
                        {ss.name}
                    </MenuItem>
                ))}

                <ListSubheader>Regular-Season Packets</ListSubheader>
                {packets.map(p => (
                    <MenuItem
                        key={`p-${p.id}`}
                        onClick={() => this.addPracticeMaterialItem('practicePacketIds', p.id)}
                        disabled={practicePacketIds.includes(p.id)}
                    >
                        {p.name}
                    </MenuItem>
                ))}

                <ListSubheader>Compilations</ListSubheader>
                {compilations.map(c => (
                    <MenuItem
                        key={`c-${c.id}`}
                        onClick={() => this.addPracticeMaterialItem('practiceCompilationIds', c.id)}
                        disabled={practiceCompilationIds.includes(c.id)}
                    >
                        {c.name}
                    </MenuItem>
                ))}
            </Menu>
        )
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
            nonConferenceGames, unassignPacketFromNonConferenceGameIds, assignPacketForNonConferenceGameIds,
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
            await Api.post(`/bookings/${booking.creationId}`, payload, onError)

            if (booking.conference && !conference) {
                await Api.delete(`/bookings/${booking.creationId}/conference`)
            } else if (conference && conference.modified) {
                await Api.post(`/bookings/${booking.creationId}/conference`, conference)
            }

            const originalNonConferenceGameIds = booking.nonConferenceGames.map(it => it.id)
            const currentNonConferenceGameIds = nonConferenceGames.map(it => it.id).filter(it => !!it)
            const deletedNonConferenceGameIds = originalNonConferenceGameIds.filter(id => !currentNonConferenceGameIds.includes(id))
            if (deletedNonConferenceGameIds.length > 0) {
                const promises = deletedNonConferenceGameIds.map(id => Api.delete(`/bookings/${booking.creationId}/nonConferenceGames/${id}`, onError))
                await Promise.all(promises)
            }

            if (unassignPacketFromNonConferenceGameIds.length > 0) {
                const promises = unassignPacketFromNonConferenceGameIds.map(gameId => Api.delete(`/bookings/${booking.creationId}/nonConferenceGames/${gameId}/packet`, onError))
                await Promise.all(promises)
            }

            if (assignPacketForNonConferenceGameIds.length > 0) {
                const promises = []
                for (const gameId of assignPacketForNonConferenceGameIds) {
                    const game = nonConferenceGames.find(game => game.id === gameId)
                    const packetId = game && game.assignedPacket ? game.assignedPacket.id : null
                    if (packetId) {
                        promises.push(Api.post(`/bookings/${booking.creationId}/nonConferenceGames/${gameId}/packet?packetId=${packetId}`, onError))
                    }
                }
                await Promise.all(promises)
            }

            const newNonConferenceGames = nonConferenceGames.filter(it => !it.id)
            if (newNonConferenceGames.length > 0) {
                await Api.post(`/bookings/${booking.creationId}/nonConferenceGames`, newNonConferenceGames, onError)
            }

            if (modifiedPracticeMaterial) {
                const promises = [
                    Api.post(`/bookings/${booking.creationId}/stateSeries`, practiceStateSeriesIds, onError),
                    Api.post(`/bookings/${booking.creationId}/practicePackets`, practicePacketIds, onError),
                    Api.post(`/bookings/${booking.creationId}/practiceCompilations`, practiceCompilationIds, onError),
                ]
                await Promise.all(promises)
            }

            await this.loadBooking()
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

    startAddInvoiceLine = () => this.setState({ addingInvoiceLine: true })

    closeAddInvoiceLine = () => this.setState({ addingInvoiceLine: false })

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

    removeNonConferenceGame = removeGameId => this.setState(prevState => ({
        nonConferenceGames: prevState.nonConferenceGames.filter(it => it.id !== removeGameId),
        nonConferenceGameMenuElt: null,
    }))

    unassignNonConferenceGamePacket = gameId => this.setState((prevState) => {
        const nonConferenceGames = []
        for (const game of prevState.nonConferenceGames) {
            if (game.id === gameId) {
                nonConferenceGames.push(
                    Object.assign(
                        {},
                        game,
                        { assignedPacket: null }
                    )
                )
            } else {
                nonConferenceGames.push(game)
            }
        }

        return {
            nonConferenceGames,
            unassignPacketFromNonConferenceGameIds: [...prevState.unassignPacketFromNonConferenceGameIds, gameId],
            nonConferenceGameMenuElt: null,
        }
    })

    startAssignNonConferenceGamePacket = gameId => this.setState({ assigningPacketForNonConferenceGameId: gameId })

    closeAssignNonConferenceGamePacket = () => this.setState({ assigningPacketForNonConferenceGameId: null, nonConferenceGameMenuElt: null })

    assignPacketForNonConferenceGame = (assignToGameId, assignedPacketId) => this.setState((prevState) => {
        const nonConferenceGames = []

        const isNewGame = assignToGameId.toString().startsWith('new-')

        for (let i = 0; i < prevState.nonConferenceGames.length; ++i) {
            const game = prevState.nonConferenceGames[i]

            let match
            if (game.id) {
                match = assignToGameId === game.id
            } else {
                match = assignToGameId === 'new-' + i
            }

            if (match) {
                nonConferenceGames.push(
                    Object.assign(
                        {},
                        game,
                        { assignedPacket: prevState.packetsById[assignedPacketId] }
                    )
                )
            } else {
                nonConferenceGames.push(game)
            }
        }

        return {
            nonConferenceGames,
            assignPacketForNonConferenceGameIds: isNewGame ? prevState.assignPacketForNonConferenceGameIds : [...prevState.assignPacketForNonConferenceGameIds, assignToGameId],
            nonConferenceGameMenuElt: null,
            assigningPacketForNonConferenceGameId: null,
        }
    })

    renderNonConferenceGames = () => {
        const { nonConferenceGames, schoolsById, packetsById, nonConferenceGameMenuElt, assigningPacketForNonConferenceGameId } = this.state

        if (nonConferenceGames && nonConferenceGames.length > 0) {
            return (
                <>
                    <dl>
                        {nonConferenceGames.map((game, index) => {
                            const gameIdSafe = game.id || 'new-' + index

                            return (
                                <div key={game.id}>
                                    <dt>
                                        {game.assignedPacket ? `${game.assignedPacket.name}` : <span className="form-error">Packet TBD</span>}
                                        <IconButton id={`non-conference-menu-${gameIdSafe}`} size="small" onClick={this.openNonConferenceGameMenu}>
                                            <MoreVert />
                                        </IconButton>
                                        <Menu
                                            anchorEl={nonConferenceGameMenuElt}
                                            open={!!nonConferenceGameMenuElt && nonConferenceGameMenuElt.id === `non-conference-menu-${gameIdSafe}`}
                                            onClose={this.closeNonConferenceGameMenu}
                                        >
                                            <MenuItem onClick={() => this.removeNonConferenceGame(gameIdSafe)}>
                                                Remove game
                                            </MenuItem>
                                            <MenuItem onClick={() => this.startAssignNonConferenceGamePacket(gameIdSafe)}>
                                                {game.assignedPacket ? 'Change packet' : 'Assign packet'}
                                            </MenuItem>
                                            <MenuItem onClick={() => this.unassignNonConferenceGamePacket(gameIdSafe)} disabled={!game.assignedPacket}>
                                                Unassign packet
                                            </MenuItem>
                                        </Menu>
                                    </dt>
                                    <dd>
                                        <ul>
                                            {game.schoolIds.map(id => <li key={id}>{schoolsById[id].shortName}</li>)}
                                        </ul>
                                    </dd>
                                </div>
                            )}
                        )}
                    </dl>
                    <NonConferenceGamePacket
                        gameId={assigningPacketForNonConferenceGameId}
                        packetsById={packetsById}
                        onCancel={this.closeAssignNonConferenceGamePacket}
                        onSubmit={(gameId, assignedPacket) => this.assignPacketForNonConferenceGame(gameId, assignedPacket)}
                    />
                </>
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

    addPracticeMaterialItem = (stateKey, id) => this.setState(prevState => ({
        [stateKey]: [...prevState[stateKey], id],
        modifiedPracticeMaterial: true,
    }))

    removePracticeMaterialItem = (stateKey, id) => this.setState(prevState => ({
        [stateKey]: prevState[stateKey].filter(it => it !== id),
        modifiedPracticeMaterial: true,
    }))

    render() {
        const {
            booking,
            schoolId, name, emailAddress, authority, statusCode, shipDate, paymentReceivedDate, internalNote,
            conference,
            addingNonConferenceGame,
            confirmingDelete, showError, saving,
            addingInvoiceLine,
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
                        displayValue={`${selectedSchool.shortName} (${selectedSchool.name}, ${selectedSchool.city}, ${selectedSchool.state})`}
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
                    <div className="display-or-edit-container-outer">
                        <h2 className="display-or-edit-container-inner">Non-Conference Games</h2>

                        <Tooltip title="Add non-conference-game">
                            <IconButton size="small" onClick={this.startAddNonConferenceGame}>
                                <Add />
                            </IconButton>
                        </Tooltip>
                        <NonConferenceGameInput
                            open={addingNonConferenceGame}
                            schools={Object.values(schoolsById)}
                            baseSchool={booking.school}
                            onClose={this.closeAddNonConferenceGame}
                            onSubmit={this.handleAddNonConferenceGame}
                        />
                    </div>

                    {this.renderNonConferenceGames()}
                </section>

                <section id="practice-material">
                    <div className="display-or-edit-container-outer">
                        <h2 className="display-or-edit-container-inner">Practice Material</h2>

                        <Tooltip title="Add practice material">
                            <IconButton size="small" onClick={this.startAddPracticeMaterial}>
                                <Add />
                            </IconButton>
                        </Tooltip>
                        {this.renderPracticeMaterialAddMenu()}
                    </div>

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

                        <Tooltip title="Add an item manually">
                            <IconButton onClick={this.startAddInvoiceLine}>
                                <Add />
                            </IconButton>
                        </Tooltip>
                        <InvoiceLineEdit
                            line={null}
                            bookingCreationId={booking.creationId}
                            open={addingInvoiceLine}
                            onClose={this.closeAddInvoiceLine}
                            onSubmit={this.loadBooking}
                        />

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
                        (
                            <InvoiceLinesTable
                                lines={booking.invoiceLines}
                                bookingCreationId={booking.creationId}
                                allowEditing
                                onChange={this.loadBooking}
                            />
                        ) :
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
