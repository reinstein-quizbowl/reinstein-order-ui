import React from 'react'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormLabel } from '@mui/material'

import SchoolPicker from '../util-components/SchoolPicker'

const initialState = (props) => ({
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
        const { school1Id, school2Id, school3Id } = this.state

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
        const { school1Id, school2Id, school3Id } = this.state

        const error = this.determineError()
        if (error) {
            this.setState({ showError: true })
        } else {
            const schoolIds = []
            if (school1Id) schoolIds.push(Number(school1Id))
            if (school2Id) schoolIds.push(Number(school2Id))
            if (school3Id) schoolIds.push(Number(school3Id))

            onSubmit({ schoolIds })
            this.handleClose()
        }
    }

    handleClose = () => this.setState(initialState(this.props), this.props.onClose)

    renderOwnTeamWarningIfAppropriate = () => {
        const { baseSchool } = this.props
        const { school1Id, school2Id, school3Id } = this.state

        if (![school1Id, school2Id, school3Id].includes(baseSchool.id)) {
            return <p className="form-warning">You have indicated that your own team won&rsquo;t be hearing the questions for this game. Make sure that&rsquo;s actually true; it&rsquo;s critical for question security!</p>
        }
    }

    render() {
        const { open, schools, baseSchool } = this.props
        const { school1Id, school2Id, school3Id, showError } = this.state

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
                    <DialogContent>
                        <div className="input-widget-container">
                            <FormControl fullWidth>
                                <FormLabel id="school1IdLabel" htmlFor="school1Id" required>
                                    Tell us one of the schools that will be playing this game.
                                </FormLabel>
                                <SchoolPicker
                                    id="school1Id"
                                    aria-labelledby="school1IdLabel"
                                    value={schools.find(it => it.id === school1Id) || null}
                                    schools={schools}
                                    onChange={this.handleSetSchool1}
                                    showDistanceFrom={baseSchool}
                                />
                            </FormControl>
                        </div>

                        <div className="input-widget-container">
                            <FormControl fullWidth>
                                <FormLabel id="school2IdLabel" htmlFor="school2Id" required>
                                    Tell us the other school that will be playing this game.
                                </FormLabel>
                                <SchoolPicker
                                    id="school2Id"
                                    aria-labelledby="school2IdLabel"
                                    value={schools.find(it => it.id === school2Id) || null}
                                    schools={schools}
                                    onChange={this.handleSetSchool2}
                                    showDistanceFrom={baseSchool}
                                />
                            </FormControl>
                        </div>

                        <div className="input-widget-container">
                            <FormControl fullWidth>
                                <FormLabel id="school3IdLabel" htmlFor="school3Id" required>
                                    Will another school hear the questions for this game (e.g., by being in the room)? If so, which?
                                </FormLabel>
                                <SchoolPicker
                                    id="school3Id"
                                    aria-labelledby="school3IdLabel"
                                    value={schools.find(it => it.id === school3Id) || null}
                                    schools={schools}
                                    onChange={this.handleSetSchool3}
                                    showDistanceFrom={baseSchool}
                                    showAddSchoolHelperText
                                />
                            </FormControl>
                        </div>

                        {this.renderOwnTeamWarningIfAppropriate()}

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
