import React from 'react'

import { v4 as uuid } from 'uuid'

import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material'
import validator from 'validator'

import '../App.css'
import AbstractStep from './AbstractStep'
import Api from '../api/Api'
import Mailto from '../util-components/Mailto'
import SchoolPicker from '../util-components/SchoolPicker'
import { isBoolean } from '../util/util'
import { AUTHORITIES } from '../util/bookingUtil'

export default class Step1Basics extends AbstractStep {
    constructor(props) {
        super(props)

        this.state = Object.assign({}, this.state, {
            schoolId: props.data && props.data.school ? props.data.school.id : null,
            name: props.data && props.data.name ? props.data.name : '',
            emailAddress: props.data && props.data.emailAddress ? props.data.emailAddress : '',
            isCoach: props.data && props.data.authority ? props.data.authority === AUTHORITIES.coach : null,
            coachKnows: props.data && props.data.authority ? props.data.authority === AUTHORITIES.coachKnows : null,
        })
    }

    getStepNumber = () => 1

    getTitle = () => 'Starting Out'

    handleSchoolChange = schoolId => this.setState({ schoolId }, () => this.nameInputRef?.current.focus())

    handleTextFieldChange = e => this.setState({ [e.target.name]: e.target.value })

    handleBooleanChange = e => this.setState({ [e.target.name]: JSON.parse(e.target.value) })

    handleSubmit = async (e) => {
        e.preventDefault()

        const { data, schoolsById, dataReloader, onError } = this.props
        const { schoolId, name, emailAddress, isCoach, coachKnows } = this.state
        
        const error = this.determineError()
        if (error) {
            this.setState({ showError: true })
        } else {
            await this.setBusy(true)

            let authority
            if (isCoach) {
                authority = AUTHORITIES.coach
            } else if (coachKnows) {
                authority = AUTHORITIES.coachKnows
            } else {
                authority = AUTHORITIES.coachDoesntKnow
            }
        
            let creationId
            if (data && data.creationId) {
                creationId = data.creationId
            } else {
                creationId = uuid()
                window.history.pushState(null, null, `/order/${creationId}`)
            }
    
            const updated = await Api.post(`/bookings/${creationId}`, { school: schoolsById[schoolId], name, emailAddress, authority }, onError)
            await dataReloader(updated)
            this.goToNextStep()
            await this.setBusy(false)
        }
    }

    determineError = () => {
        const { schoolId, name, emailAddress, isCoach, coachKnows } = this.state

        if (!schoolId) return 'Please indicate what school you are from.'

        if (!name) return 'Please give your name.'
        if (!name.includes(' ')) return 'Please give your full name.'

        if (!emailAddress) return 'Please give your email address.'
        if (!validator.isEmail(emailAddress)) return 'Please use a valid email address.'

        if (!isBoolean(isCoach)) return 'Please indicate whether you are the coach.'

        if (!isCoach && !isBoolean(coachKnows)) return 'Please indicate whether the coach knows the exact order you are placing.'

        return null
    }

    nameInputRef = React.createRef()

    renderBody = () => {
        const { schoolsById } = this.props
        const { schoolId, name, emailAddress, isCoach, coachKnows, showError } = this.state

        const error = this.determineError()

        return (
            <form onSubmit={this.handleSubmit}>
                <div className="input-widget-container">
                    <FormControl fullWidth>
                        <FormLabel id="schoolLabel" htmlFor="school" required>
                            What school are you placing this order on behalf of?
                        </FormLabel>
                        <SchoolPicker
                            id="school"
                            aria-labelledby="schoolLabel"
                            value={schoolId ? schoolsById[schoolId] : null}
                            schools={Object.values(schoolsById).filter(it => it.active)}
                            onChange={this.handleSchoolChange}
                            placeholder="Choose school&hellip;"
                            helperText={<>If your school is not listed, please write to <Mailto />.</>}
                            autoFocus
                        />
                    </FormControl>
                </div>

                <div className="input-widget-container">
                    <FormControl fullWidth>
                        <FormLabel id="nameLabel" htmlFor="name" required>
                            What is your name?
                        </FormLabel>
                        <TextField
                            aria-labelledby="nameLabel"
                            id="name"
                            name="name"
                            value={name}
                            onChange={this.handleTextFieldChange}
                            inputProps={{ className: 'input' }}
                            inputRef={this.nameInputRef}
                            required
                            fullWidth
                        />
                    </FormControl>
                </div>

                <div className="input-widget-container">
                    <FormControl fullWidth>
                        <FormLabel id="emailLabel" htmlFor="email" required>
                            What is your email address?
                        </FormLabel>
                        <TextField
                            aria-labelledby="emailLabel"
                            id="emailAddress"
                            name="emailAddress"
                            type="email"
                            value={emailAddress}
                            onChange={this.handleTextFieldChange}
                            inputProps={{ className: 'input' }}
                            required
                            fullWidth
                        />
                    </FormControl>
                </div>

                <div className="input-widget-container">
                    <FormControl>
                        <FormLabel id="isCoachLabel" required>
                            Are you the coach{schoolId ? ` of ${schoolsById[schoolId].shortName}` : ''}?
                        </FormLabel>
                        <RadioGroup
                            aria-labelledby="isCoachLabel"
                            name="isCoach"
                            value={isCoach}
                            onChange={this.handleBooleanChange}
                        >
                            <FormControlLabel value="true" control={<Radio />} label="Yes" className="radio-or-checkbox" />
                            <FormControlLabel value="false" control={<Radio />} label="No" className="radio-or-checkbox" />
                        </RadioGroup>
                    </FormControl>
                </div>

                {isCoach === false && (
                    <div className="input-widget-container">
                        <FormControl>
                            <FormLabel id="coachKnowsLabel" required>
                                Does the coach know the exact order you are placing?
                            </FormLabel>
                            <RadioGroup
                                aria-labelledby="coachKnowsLabel"
                                name="coachKnows"
                                value={coachKnows}
                                onChange={this.handleBooleanChange}
                            >
                                <FormControlLabel value="true" control={<Radio />} label="Yes" className="radio-or-checkbox" />
                                <FormControlLabel value="false" control={<Radio />} label="No" className="radio-or-checkbox" />
                            </RadioGroup>
                        </FormControl>
                    </div>
                )}

                {showError && <p className="form-error">{error}</p>}

                <p className="form-submit-container">
                    <Button
                        type="submit"
                        onClick={this.handleSubmit}
                        variant="contained"
                        disabled={showError && !!error}
                    >
                        Continue&hellip;
                    </Button>
                </p>
            </form>
        )
    }
}
