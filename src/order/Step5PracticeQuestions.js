import React from 'react'

import { Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Radio, RadioGroup } from '@mui/material'

import '../App.css'
import AbstractStep from './AbstractStep'
import Api from '../api/Api'
import { isBoolean, formatMoney } from '../util/util'

export default class Step5PracticeQuestions extends AbstractStep {
    constructor(props) {
        super(props)

        /* If there's already data, reconstruct what years they were ordering from so that they can be shown their selections.
         * This doesn't properly figure out which ones they chose "all packets" for, because the information necessary to do that isn't available (it's loaded in loadPackets()) and because that would be even more annoying than this already is.
         */
        const yearSelections = {}
        if (props.data && props.data.packetOrders && props.data.packetOrders.length > 0) {
            for (const order of props.data.packetOrders) {
                yearSelections[order.packet.yearCode] = 'chooseSpecificPackets'
            }
        }

        this.state = {
            yearsByCode: null,
            packetsByYear: null,
            compilations: null,

            orderPracticeQuestions: props.data && ((props.data.packetOrders && props.data.packetOrders.length > 0) || (props.data.compilationOrders && props.data.compilationOrders.length > 0)) ? true : null,
            yearSelections,
            packetIds: props.data && props.data.packetOrders ? props.data.packetOrders.map(it => it.packet.id) : [],
            compilationIds: props.data && props.data.compilationOrders ? props.data.compilationOrders.map(it => it.compilation.id) : [],

            showError: false,
        }
    }

    componentDidMount() {
        this.loadYears()
        this.loadPackets()
        this.loadCompilations()
    }

    loadYears = async () => {
        if (this.state.yearsByCode) return

        const years = await Api.get(`/years`)

        const yearsByCode = {}
        for (const year of years) {
            yearsByCode[year.code] = year
        }

        this.setState({ yearsByCode })
    }

    loadPackets = async () => {
        if (this.state.packetsByYear) return

        const packets = await Api.get(`/packets?filter=availableForPractice`)

        const packetsByYear = {}
        for (const packet of packets) {
            if (!packetsByYear[packet.yearCode]) packetsByYear[packet.yearCode] = []

            packetsByYear[packet.yearCode].push(packet)
        }

        // The API returns packets sorted by year then number, so the order should already be sensible

        this.setState({ packetsByYear })
    }

    loadCompilations = async () => {
        if (this.state.compilations) return

        const compilations = await Api.get(`/compilations`)
        this.setState({ compilations })
    }

    getStepNumber = () => 5

    getTitle = () => 'Practice Questions'

    handleBooleanChange = e => this.setState({ [e.target.name]: JSON.parse(e.target.value) })

    handleChange = e => this.setState({ [e.target.name]: e.target.value })

    handleYearSelectionChange = (e) => {
        const { name, value } = e.target

        this.setState(prevState => ({ yearSelections: Object.assign({}, prevState.yearSelections, { [name]: value })}))

        if (value === 'allPackets') {
            const { packetsByYear } = this.state
            const packetsForYear = packetsByYear[name]
            this.setState(prevState => {
                const packetIds = [...prevState.packetIds]
                for (const packet of packetsForYear) {
                    if (!packetIds.includes(packet.id)) {
                        packetIds.push(packet.id)
                    }
                }

                return { packetIds }
            })
        } else if (value === 'none') {
            const { packetsByYear } = this.state
            const packetsIdsForYear = packetsByYear[name].map(it => it.id)
            this.setState(prevState => ({ packetIds: prevState.packetIds.filter(it => !packetsIdsForYear.includes(it)) }))
        }
    }

    togglePacket = (packetId) => this.setState(prevState => {
        const oldPacketIds = prevState.packetIds

        if (oldPacketIds.includes(packetId)) {
            return { packetIds: oldPacketIds.filter(it => it !== packetId) }
        } else {
            return { packetIds: [packetId, ...oldPacketIds]}
        }
    })

    toggleCompilation = (compilationId) => this.setState(prevState => {
        const oldCompilationIds = prevState.compilationIds

        if (oldCompilationIds.includes(compilationId)) {
            return { compilationIds: oldCompilationIds.filter(it => it !== compilationId) }
        } else {
            return { compilationIds: [compilationId, ...oldCompilationIds]}
        }
    })

    handleSubmit = async (e) => {
        e.preventDefault()

        const { data, dataReloader } = this.props
        const { orderPracticeQuestions, packetIds, compilationIds } = this.state
        
        const error = this.determineError()
        if (error) {
            this.setState({ showError: true })
            return
        }
        
        const promises = [
            Api.post(`/bookings/${data.creationId}/practicePackets`, orderPracticeQuestions ? packetIds : []),
            Api.post(`/bookings/${data.creationId}/practiceCompilations`, orderPracticeQuestions ? compilationIds : []),
        ]
        await Promise.all(promises)
        await dataReloader()
        
        this.goToNextStep()
    }

    determineError = () => {
        const { orderPracticeQuestions } = this.state

        if (!isBoolean(orderPracticeQuestions)) return 'Please tell us whether you want to order practice questions.'

        return null
    }

    renderPackets = () => {
        const { yearsByCode, packetsByYear } = this.state
        if (!yearsByCode || !packetsByYear) return null

        const years = Object.values(yearsByCode).sort((a, b) => b.code.localeCompare(a.code)) // most recent first
        return years.map(year => this.renderPacketsForYear(year, packetsByYear[year.code]))
    }

    renderPacketsForYear = (year, packets) => {
        const { yearSelections } = this.state
        if (!packets || packets.length === 0) return null

        const distinctPrices = new Set(packets.map(it => it.priceAsPracticeMaterial))
        const chooseSpecificPacketsLabel = distinctPrices.size === 1 ? `Choose specific packets (${formatMoney(packets[0].priceAsPracticeMaterial)} each)` : 'Choose specific packets'

        return (
            <div key={year.code} className="input-widget-container">
                <FormControl>
                    <FormLabel id={`${year.code}Label`}>
                        Questions from {year.name.replace('-', '–')}
                    </FormLabel>
                    <RadioGroup
                        aria-labelledby={`${year.code}Label`}
                        name={year.code}
                        value={yearSelections[year.code] || null}
                        onChange={this.handleYearSelectionChange}
                    >
                        <FormControlLabel value="allPackets" control={<Radio />} label={<>All packets ({formatMoney(year.maximumPacketPracticeMaterialPrice)})</>} />
                        <FormControlLabel value="chooseSpecificPackets" control={<Radio />} label={chooseSpecificPacketsLabel} />
                        {yearSelections[year.code] === 'chooseSpecificPackets' && this.renderSpecificPacketsChooser(packets, distinctPrices.size === 1)}
                        <FormControlLabel value="none" control={<Radio />} label="None" />
                    </RadioGroup>
                </FormControl>
            </div>
        )
    }

    renderSpecificPacketsChooser = (packets, priceAlreadyShown) => (
        <FormControl component="fieldset" variant="standard" style={{ paddingLeft: '2rem' }}>
            <FormGroup>
                {packets.map(packet => this.renderPacketCheckbox(packet, priceAlreadyShown))}
            </FormGroup>
        </FormControl>
    )

    renderPacketCheckbox = (packet, priceAlreadyShown) => {
        const { packetIds } = this.state

        let label = `Packet ${packet.number}`
        if (!priceAlreadyShown) {
            label += ` (${formatMoney(packet.priceAsPracticeMaterial)})`
        }

        return (
            <FormControlLabel
                key={packet.id}
                control={<Checkbox checked={packetIds.includes(packet.id)} onChange={() => this.togglePacket(packet.id)} name="packetId" value={packet.id} />}
                label={label}
            />
        )
    }

    renderCompilations = () => {
        const { compilations } = this.state
        if (!compilations) return null

        return (
            <div className="input-widget-container">
                <FormControl>
                    <FormLabel id="compilationsLabel">
                        Questions by Category
                    </FormLabel>
                    <FormGroup>
                        {compilations.map(compilation => this.renderCompilationCheckbox(compilation))}
                    </FormGroup>
                </FormControl>
            </div>
        )
    }

    renderCompilationCheckbox = (compilation) => {
        const { compilationIds } = this.state

        const parenthetical = compilation.description ?
            `${compilation.description}; ${formatMoney(compilation.price)}` :
            formatMoney(compilation.price)

        return (
            <FormControlLabel
                key={compilation.id}
                control={<Checkbox checked={compilationIds.includes(compilation.id)} onChange={() => this.toggleCompilation(compilation.id)} name="compilationId" value={compilation.id} />}
                label={`${compilation.name} (${parenthetical})`}
            />
        )
    }

    renderBody = () => {
        const { orderPracticeQuestions, showError } = this.state

        const error = this.determineError()

        return (
            <form onSubmit={this.handleSubmit}>
                <div className="input-widget-container">
                    <FormControl>
                        <FormLabel id="orderPracticeQuestionsLabel" required>
                            Do you want to order practice questions? These are questions from previous years and <em>must only be used with your school, not with other schools</em>.
                        </FormLabel>
                        <RadioGroup
                            aria-labelledby="orderPracticeQuestionsLabel"
                            name="orderPracticeQuestions"
                            value={orderPracticeQuestions}
                            onChange={this.handleBooleanChange}
                        >
                            <FormControlLabel value="true" control={<Radio />} label="Yes" />
                            <FormControlLabel value="false" control={<Radio />} label="No" />
                        </RadioGroup>
                    </FormControl>
                </div>

                {orderPracticeQuestions && (
                    <>
                        <p>These questions have not been updated based on events that occurred after the questions were used in the year they were written for.</p>
                        {this.renderPackets()}
                        {this.renderCompilations()}
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
                        Continue&hellip;
                    </Button>
                </p>
            </form>
        )
    }
}
