import React from 'react'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormLabel } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'

import SchoolPicker from '../util-components/SchoolPicker'

const initialState = (props) => ({
    date: '',
    school1Id: props.baseSchool ? props.baseSchool.id : null,
    school2Id: null,
    school3Id: null,
    showError: false,
})

export default class NonConferenceGameInput extends React.PureComponent {
    constructor(props) {
        super(props)
        
        this.state = initialState(props)
    }

    determineError = () => {
        const { date, school1Id, school2Id, school3Id } = this.state

        if (!date) return 'Please tell us the date of this game.'

        if (!school1Id || !school2Id) return 'Please tell us the schools that will be playing this game.'

        if (school1Id === school2Id || school1Id === school3Id || school2Id === school3Id) return 'You have listed the same school twice.'

        return null
    }

    handleSetSchool1 = school1Id => this.setState({ school1Id })

    handleSetSchool2 = school2Id => this.setState({ school2Id })

    handleSetSchool3 = school3Id => this.setState({ school3Id })

    handleSubmit = (e) => {
        e.preventDefault()

        const { onSubmit } = this.props
        const { date, school1Id, school2Id, school3Id } = this.state

        const error = this.determineError()
        if (error) {
            this.setState({ showError: true })
        } else {
            const schoolIds = []
            if (school1Id) schoolIds.push(Number(school1Id))
            if (school2Id) schoolIds.push(Number(school2Id))
            if (school3Id) schoolIds.push(Number(school3Id))

            onSubmit({ date, schoolIds })
            this.handleClose()
        }
    }

    handleClose = () => this.setState(initialState(this.props), this.props.onClose)

    render() {
        const { open, schools, year, baseSchool } = this.props
        const { date, school1Id, school2Id, school3Id, showError } = this.state

        const error = this.determineError()
        
        return (
            <Dialog
                open={open}
                onClose={this.handleClose}
                fullWidth
                maxWidth="lg"
            >
                <form onSubmit={this.handleSubmit}>
                    <DialogTitle>Add a Game</DialogTitle>
                    <DialogContent style={{ minHeight: 500 /* to give room for the DatePicker popover */ }}>
                        <div className="input-widget-container">
                            <FormControl>
                                <FormLabel id="dateLabel" htmlFor="date" required>
                                    What is the date of this game?
                                </FormLabel>
                                <DatePicker
                                    id="date"
                                    aria-labelledby="dateLabel"
                                    value={date ? dayjs(date) : null}
                                    onChange={date => this.setState({ date })}
                                    required
                                    minDate={dayjs().add(1, 'week')}
                                    maxDate={dayjs(year.endDate)}
                                    inputProps={{ className: 'date-input' }}
                                    autoFocus
                                />
                            </FormControl>
                        </div>
                        
                        <div className="input-widget-container">
                            <SchoolPicker
                                id="school1Id"
                                value={schools.find(it => it.id === school1Id) || null}
                                schools={schools}
                                onChange={this.handleSetSchool1}
                                label="Tell us one of the schools that will be playing this game."
                                showDistanceFrom={baseSchool}
                            />
                        </div>
                        
                        <div className="input-widget-container">
                            <SchoolPicker
                                id="school2Id"
                                value={schools.find(it => it.id === school2Id) || null}
                                schools={schools}
                                onChange={this.handleSetSchool2}
                                label="Tell us the other school that will be playing this game."
                                showDistanceFrom={baseSchool}
                            />
                        </div>
                        
                        <div className="input-widget-container">
                            <SchoolPicker
                                id="school3Id"
                                value={schools.find(it => it.id === school3Id) || null}
                                schools={schools}
                                onChange={this.handleSetSchool3}
                                label="Will another school be present for this game? If so, which?"
                                showAddSchoolHelperText
                                showDistanceFrom={baseSchool}
                            />
                        </div>

                        {showError && <p className="form-error">{error}</p>}
                    </DialogContent>
                    <DialogActions>
                        <Button variant="outlined" onClick={this.handleClose}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={this.handleSubmit}
                            disabled={showError && !!error}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        )
    }
}
