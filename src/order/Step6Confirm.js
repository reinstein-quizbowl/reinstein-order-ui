import React from 'react'

import { Button, FormControl, FormControlLabel, FormLabel, IconButton, Radio, RadioGroup, TextField } from '@mui/material'
import { Edit } from '@mui/icons-material'

import '../App.css'
import AbstractStep from './AbstractStep'
import Api from '../api/Api'
import InvoiceLinesTable from '../invoice/InvoiceLinesTable'
import { makeEnglishList } from '../util/util'

export default class Step6Confirm extends AbstractStep {
    constructor(props) {
        super(props)

        this.state = {
            invoiceLines: null,
            externalNote: props.data ? (props.data.externalNote || '') : '',
            requestsW9: props.data ? !!props.data.requestsW9 : false,
            showError: false,
        }
    }

    componentDidMount() {
        if (this.isExpanded()) {
            this.loadInvoiceLines()
        }
    }

    componentDidUpdate(prevProps) {
        if (this.isExpanded() && !this.wasExpanded(prevProps)) {
            this.loadInvoiceLines()
        }
    }

    loadInvoiceLines = async () => {
        const { data } = this.props
        const invoiceLines = await Api.get(`/bookings/${data.creationId}/invoicePreview`)
        this.setState({ invoiceLines })
    }

    getStepNumber = () => 6

    getTitle = () => 'Confirm Order'

    handleTextFieldChange = e => this.setState({ [e.target.name]: e.target.value })

    handleBooleanChange = e => this.setState({ [e.target.name]: JSON.parse(e.target.value) })

    handleSubmit = async (e) => {
        e.preventDefault()

        const { data, dataReloader } = this.props
        const { externalNote, requestsW9 } = this.state
        
        const error = this.determineError()
        if (error) {
            this.setState({ showError: true })
        } else {
            await Api.post(`/bookings/${data.creationId}`, { externalNote, requestsW9 })
            const submitted = await Api.post(`/bookings/${data.creationId}/submit`, { externalNote, requestsW9 })
            await dataReloader(submitted)
        }
    }

    determineError = () => {
        // There isn't actually anything to check here, but I'm leaving the structure for ease of expansion

        return null
    }

    renderGoToStepButton = stepNumber => (
        <IconButton onClick={() => this.props.onGoToStep(stepNumber)}>
            <Edit />
        </IconButton>
    )

    renderSchoolListItem = (id) => {
        const { schoolsById } = this.props
        const school = schoolsById[id]
        if (!school) return null

        return <li key={id}>{school.name} ({school.city}, {school.state})</li>
    }

    renderConference = (conference) => {
        if (!conference) return <p>None</p>

        return (
            <>
                <ul>
                    {conference.schoolIds.map(this.renderSchoolListItem)}
                </ul>
                <p><span className="order-review-key">Packets</span> {makeEnglishList(conference.assignedPackets.map(it => it.number))}</p>
            </>
        )
    }

    renderNonConferenceGames = (games) => {
        if (!games || games.length === 0) return <p>None</p>
        
        return (
            <>
                <ul>
                    {games.map(this.renderNonConferenceGame)}
                </ul>
            </>
        )
    }

    renderNonConferenceGame = game => (
        <li key={game.id}>
            {makeEnglishList(game.schoolIds.map(id => this.props.schoolsById[id].shortName))}:{' '}
            Packet {game.assignedPacket ? game.assignedPacket.number : 'TBD'}
        </li>
    )

    renderBody = () => {
        const { data } = this.props
        const { invoiceLines, externalNote, requestsW9, showError } = this.state

        if (!data) return null

        const error = this.determineError()

        return (
            <>
                <p>Let&rsquo;s review your order:</p>

                <section className="order-review">
                    <h2>Basics {this.renderGoToStepButton(1)}</h2>
                    <ul>
                        <li><span className="order-review-key">Your Name</span> {data.name}</li>
                        <li><span className="order-review-key">Your Email Address</span> {data.emailAddress}</li>
                        <li><span className="order-review-key">School</span> {data.school.name} ({data.school.city}, {data.school.state})</li>
                    </ul>
                </section>

                <section className="order-review">
                    <h2>{data.conference ? data.conference.name : 'Conference'} {this.renderGoToStepButton(2)}</h2>
                    {this.renderConference(data.conference)}
                </section>

                <section className="order-review">
                    <h2>Non-Conference Games {this.renderGoToStepButton(3)}</h2>
                    {this.renderNonConferenceGames(data.nonConferenceGames)}
                </section>

                {/* We don't show the practice material separately because there isn't anything interesting to say about it beyond what's shown on the invoice */}

                <section className="order-review invoice-wrapper">
                    <h2>Invoice Preview</h2>
                    <InvoiceLinesTable lines={invoiceLines} />
                </section>

                <form onSubmit={this.handleSubmit}>
                    <div className="input-widget-container">
                        <FormControl>
                            <FormLabel id="requestsW9Label" required>
                                Do you need a Form W-9?
                            </FormLabel>
                            <RadioGroup
                                aria-labelledby="requestsW9Label"
                                name="requestsW9"
                                value={requestsW9}
                                onChange={this.handleBooleanChange}
                            >
                                <FormControlLabel value="true" control={<Radio />} label="Yes" />
                                <FormControlLabel value="false" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>
                    </div>
                
                    <div className="input-widget-container">
                        <TextField
                            id="externalNote"
                            name="externalNote"
                            value={externalNote}
                            onChange={this.handleTextFieldChange}
                            inputProps={{ className: 'input' }}
                            label="Is there anything else we should know?"
                            InputLabelProps={{ shrink: true, className: 'input-label' }}
                            multiline
                            fullWidth
                        />
                    </div>

                    {showError && <p className="form-error">{error}</p>}
                    
                    <p className="form-submit-container">
                        <Button
                            type="submit"
                            onClick={this.handleSubmit}
                            variant="contained"
                            disabled={showError && !!error}
                        >
                            Submit Order
                        </Button>
                    </p>
                </form>
            </>
        )
    }
}
