import React from 'react'

import { Button, FormControl, FormControlLabel, FormLabel, IconButton, Radio, RadioGroup, Tooltip } from '@mui/material'
import { Close } from '@mui/icons-material'

import '../App.css'
import AbstractStep from './AbstractStep'
import NonConferenceGameInput from './NonConferenceGameInput'
import Api from '../api/Api'
import { isBoolean, makeEnglishList } from '../util/util'

export default class Step3NonConferenceGames extends AbstractStep {
    constructor(props) {
        super(props)

        this.state = {
            orderNonConferenceGames: null,
            nonConferenceGames: [],
            adding: false,
            showError: false,
        }
    }

    getStepNumber = () => 3

    getTitle = () => 'Non-Conference Games'

    handleBooleanChange = e => this.setState({ [e.target.name]: JSON.parse(e.target.value) })

    handleChange = e => this.setState({ [e.target.name]: e.target.value })

    startAddingGame = () => this.setState({ adding: true })

    closeAddingGame = () => this.setState({ adding: false })

    handleAddGame =  newGame => this.setState(prevState => ({ nonConferenceGames: [...prevState.nonConferenceGames, newGame] }))

    handleDeleteGame = deleteIndex => this.setState((prevState) => {
        const old = prevState.nonConferenceGames
        const nonConferenceGames = []
        for (let i = 0; i < old.length; ++i) {
            if (i !== deleteIndex) {
                nonConferenceGames.push(old[i])
            }
        }

        return { nonConferenceGames }
    })

    handleSubmit = async (e) => {
        e.preventDefault()

        const { data, dataReloader } = this.props
        const { orderNonConferenceGames, nonConferenceGames } = this.state
        
        const error = this.determineError()
        if (error) {
            this.setState({ showError: true })
            return
        }

        if (orderNonConferenceGames) {
            const reloadedData = await Api.post(`/bookings/${data.creationId}/nonConferenceGames`, nonConferenceGames)
            await dataReloader(reloadedData)
        }
        
        this.goToNextStep()
    }

    determineError = () => {
        const { orderNonConferenceGames, nonConferenceGames } = this.state

        if (!isBoolean(orderNonConferenceGames)) return 'Please tell us whether you want to order questions for games that are not part of your conference.'

        if (orderNonConferenceGames) {
            if (!nonConferenceGames || nonConferenceGames.length === 0) return 'Please let us know the details of your non-conference games so that we can check whether questions are available.'
        }

        return null
    }

    renderNonConferenceGames = () => {
        const { nonConferenceGames } = this.state

        if (!nonConferenceGames || nonConferenceGames.length === 0) return null

        return (
            <>
                <ul className="non-conference-games">
                    {nonConferenceGames.map(this.renderNonConferenceGame)}
                </ul>
                <p>If you made a mistake above, delete the game and re-enter it.</p>
            </>
        )
    }

    renderNonConferenceGame = (game, index) => (
        <li key={index}>
            {this.renderSchoolShortNames(game.schoolIds)}
            <Tooltip title="Delete">
                <IconButton onClick={() => this.handleDeleteGame(index)} size="small">
                    <Close />
                </IconButton>
            </Tooltip>
        </li>
    )

    renderSchoolShortNames = schoolIds => makeEnglishList(schoolIds.map(schoolId => this.props.schoolsById[schoolId].shortName))

    renderBody = () => {
        const { data, packets, schoolsById, year } = this.props
        const { orderNonConferenceGames, nonConferenceGames, adding, showError } = this.state

        const error = this.determineError()

        return (
            <form onSubmit={this.handleSubmit}>
                <div className="input-widget-container">
                    <FormControl>
                        <FormLabel id="orderNonConferenceGamesLabel" required>
                            Do you want to order questions for games that are not part of your conference?
                        </FormLabel>
                        <RadioGroup
                            aria-labelledby="orderNonConferenceGamesLabel"
                            name="orderNonConferenceGames"
                            value={orderNonConferenceGames}
                            onChange={this.handleBooleanChange}
                        >
                            <FormControlLabel value="true" control={<Radio />} label="Yes" />
                            <FormControlLabel value="false" control={<Radio />} label="No" />
                        </RadioGroup>
                    </FormControl>
                </div>

                {orderNonConferenceGames && (
                    <>
                        {this.renderNonConferenceGames()}
                        <p>
                            <Button
                                onClick={this.startAddingGame}
                                variant="contained"
                                disabled={nonConferenceGames.length >= packets.length}
                            >
                                Add a Game
                            </Button>
                        </p>
                        <NonConferenceGameInput
                            open={adding}
                            schools={Object.values(schoolsById)}
                            year={year}
                            baseSchool={data.school}
                            onClose={this.closeAddingGame}
                            onSubmit={this.handleAddGame}
                        />
                    </>
                )}

                {showError && <p className="form-error">{error}</p>}
                
                <p className="form-submit-container">
                    <Button
                        type="submit"
                        onClick={this.handleSubmit}
                        variant="contained"
                        disabled={showError && !!error}
                    >
                        {orderNonConferenceGames ? 'I’m Done Entering My Games' : 'Continue…'}
                    </Button>
                </p>
            </form>
        )
    }
}
