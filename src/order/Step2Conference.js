import React from 'react'

import { Button, FormControl, FormControlLabel, FormLabel, IconButton, Radio, RadioGroup, TextField, Tooltip } from '@mui/material'
import { Close } from '@mui/icons-material'

import '../App.css'
import AbstractStep from './AbstractStep'
import Api from '../api/Api'
import { isBoolean } from '../util/util'
import SchoolPicker, { renderDistance } from '../util-components/SchoolPicker'

export default class Step2Conference extends AbstractStep {
    constructor(props) {
        super(props)

        this.state = {
            orderingForConference: props.orderingForConference || (props.data && props.data.conference) ? true : null,
            conferenceName: props.data && props.data.conference ? props.data.conference.name : '',
            otherSchoolIds: props.data && props.data.conference ? props.data.conference.schoolIds.filter(it => it !== props.data.school.id) : [],
            packetsRequested: props.data && props.data.conference ? props.data.conference.packetsRequested : null,
            showError: false,
        }
    }

    getStepNumber = () => 2

    getTitle = () => 'Conference'

    handleAddSchool = (newSchoolId) => {
        const { data } = this.props
        if (newSchoolId === data.school.id) return

        this.setState((prevState) => {
            const oldSchoolIds = prevState.otherSchoolIds
            if (!oldSchoolIds.includes(newSchoolId)) {
                return { otherSchoolIds: [...oldSchoolIds, newSchoolId] }
            }
        })
    }

    handleRemoveSchool = removeSchoolId => this.setState(prevState => ({ otherSchoolIds: prevState.otherSchoolIds.filter(it => it !== removeSchoolId) }))

    handleChange = e => this.setState({ [e.target.name]: e.target.value })

    handleOrderingForConferenceChange = (e) => {
        const orderingForConference = e.target.value
        if (JSON.parse(orderingForConference)) {
            this.setState({ orderingForConference: true })
        } else {
            this.setState({
                orderingForConference: false,
                conferenceName: '',
                otherSchoolIds: [],
                packetsRequested: null,
            })
        }
    }

    getAllSchoolIds = () => {
        const { data } = this.props
        const { otherSchoolIds } = this.state

        return [data.school.id, ...otherSchoolIds]
    }

    handleSubmit = async (e) => {
        e.preventDefault()

        const { data, dataReloader } = this.props
        const { orderingForConference, conferenceName, packetsRequested } = this.state
        
        const error = this.determineError()
        if (error) {
            this.setState({ showError: true })
            return
        }

        if (orderingForConference) {
            const updated = await Api.post(`/bookings/${data.creationId}/conference`, { name: conferenceName, packetsRequested, schoolIds: this.getAllSchoolIds() })
            await dataReloader(updated)
        }

        this.goToNextStep()
    }

    determineError = () => {
        const { packets } = this.props
        const { orderingForConference, conferenceName, otherSchoolIds, packetsRequested } = this.state

        if (!isBoolean(orderingForConference)) return 'Please indicate whether you are ordering for a conference or tournament.'

        if (orderingForConference) {
            if (!conferenceName) return 'Please give the name of the conference or tournament.'
            if (!otherSchoolIds || otherSchoolIds.length === 0) return 'Please specify the other schools in the conference.'
            if (otherSchoolIds.length < 2) return 'Presumably there are at least three schools in the conference.' // The orderer's own school is presumed to be one of them.
            if (!packetsRequested || packetsRequested < 1) return 'Please tell us how many packets of questions you want for the conference.'
            if (packetsRequested > packets.length) return `We’re only writing ${packets.length} packets of questions this year, so you can’t request more than that.`
        }

        return null
    }

    renderChosenSchool = (schoolId) => {
        const { data, schoolsById } = this.props

        const school = schoolsById[schoolId]
        if (!school) {
            console.warn('could not find school by id', { schoolId, schoolsById })
            return null
        }

        const baseSchool = data.school
        const isBase = baseSchool.id === school.id
        return (
            <li key={school.id} className="school-chosen-for-game">
                {school.shortName}{' '}
                (
                {school.name}, {school.city}, {school.state}
                {!isBase && <>; {renderDistance(baseSchool, school)}</>}
                )
                {!isBase && (
                    <Tooltip title="Remove">
                        <IconButton onClick={() => this.handleRemoveSchool(school.id)} size="small">
                            <Close />
                        </IconButton>
                    </Tooltip>
                )}
            </li>
        )
    }

    renderBody = () => {
        const { data, schoolsById, packets } = this.props
        const { orderingForConference, conferenceName, otherSchoolIds, packetsRequested, showError } = this.state

        const error = this.determineError()

        return (
            <form onSubmit={this.handleSubmit}>
                <div className="input-widget-container">
                    <FormControl>
                        <FormLabel id="orderingForConferenceLabel" required>
                            Are you in charge of ordering questions for a conference or tournament?
                        </FormLabel>
                        <RadioGroup
                            aria-labelledby="orderingForConferenceLabel"
                            name="orderingForConference"
                            value={orderingForConference}
                            onChange={this.handleOrderingForConferenceChange}
                        >
                            <FormControlLabel value="true" control={<Radio />} label="Yes" />
                            <FormControlLabel value="false" control={<Radio />} label="No" />
                        </RadioGroup>
                    </FormControl>
                </div>

                {orderingForConference && (
                    <>
                        <div className="input-widget-container">
                            <TextField
                                id="conferenceName"
                                name="conferenceName"
                                value={conferenceName}
                                onChange={this.handleChange}
                                inputProps={{ className: 'input' }}
                                label="What is the name of the conference?"
                                InputLabelProps={{ shrink: true, className: 'input-label' }}
                                required
                                fullWidth
                            />
                        </div>

                        <FormLabel required>
                            What schools are in the conference?
                        </FormLabel>
                        <ul className="schools-chosen-for-conference">
                            {this.renderChosenSchool(data.school.id)}
                            {otherSchoolIds.map(this.renderChosenSchool)}
                        </ul>
                        <div className="input-widget-container">
                            <SchoolPicker
                                value={null}
                                schools={Object.values(schoolsById)}
                                onChange={this.handleAddSchool}
                                label="Add a school"
                                showAddSchoolHelperText
                                showDistanceFrom={data.school}
                            />
                        </div>

                        <div className="input-widget-container">
                            <TextField
                                id="packetsRequested"
                                name="packetsRequested"
                                type="number"
                                value={packetsRequested || ''}
                                onChange={this.handleChange}
                                inputProps={{ className: 'input', min: 2, max: packets.length }}
                                label="How many packets (rounds’ worth of questions) do you want to order?"
                                InputLabelProps={{ shrink: true, className: 'input-label' }}
                                required
                                fullWidth
                            />
                        </div>
                    </>
                )}

                {showError && <p className="form-error">{error}</p>}

                <p className="form-submit-container">
                    <Button
                        type="submit"
                        onClick={this.handleSubmit}
                        variant="contained"
                    >
                        Continue&hellip;
                    </Button>
                </p>
            </form>
        )
    }
}
