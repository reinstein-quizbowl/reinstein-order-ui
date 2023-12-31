import React from 'react'
import PropTypes from 'prop-types'

import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { CheckCircle, RadioButtonChecked, RadioButtonUnchecked } from '@mui/icons-material'

import LoadingOverlay from '../util-components/LoadingOverlay'
import { setStatePromise } from '../util/util'

export default class AbstractStep extends React.PureComponent {
    static propTypes = {
        currentStep: PropTypes.number.isRequired,
        highestSeenStep: PropTypes.number.isRequired,
        onGoToStep: PropTypes.func.isRequired,
        onToggleExpansion: PropTypes.func, // omit to prevent toggling
        year: PropTypes.object.isRequired, // ApiYear
        schoolsById: PropTypes.object.isRequired, // Map<Long, ApiSchool>
        packets: PropTypes.array.isRequired, // Array<ApiPacket>
        data: PropTypes.object, // ApiBooking; should only be omitted before it is created
        dataReloader: PropTypes.func.isRequired,
        onError: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)

        this.state = {
            busy: false,
            showError: false,
        }
    }

    getStepNumber = () => {
        console.warn('Must override getStepNumber() in ' + this.constructor.name)
        return -1
    }

    getTitle = () => {
        console.warn('Must override getTitle()')
        return 'Order Questions'
    }

    renderBody = () => {
        console.warn('Must override renderBody()')
        return null
    }

    setBusy = async (busy) => {
        await setStatePromise(this, { busy })
    }

    goToNextStep = () => this.props.onGoToStep(this.getStepNumber() + 1)

    wasExpanded = props => props.currentStep === this.getStepNumber()

    isExpanded = () => this.wasExpanded(this.props)

    isBusy = () => this.state.busy // can be overridden if busyness involves other state variables

    render() {
        const { highestSeenStep, onToggleExpansion } = this.props

        const expanded = this.isExpanded()

        let icon
        if (expanded) {
            icon = <RadioButtonChecked />
        } else if (highestSeenStep >= this.getStepNumber()) {
            icon = <CheckCircle color="success" />
        } else {
            icon = <RadioButtonUnchecked />
        }

        return (
            <Accordion expanded={expanded} onChange={onToggleExpansion}>
                <AccordionSummary classes={{ content: 'booking-step-header' }}>
                    {icon}
                    <span style={{ width: '0.5rem' }} />
                    <Typography variant="h2">{this.getTitle()}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {this.isBusy() && <LoadingOverlay />}
                    {this.renderBody()}
                </AccordionDetails>
            </Accordion>
        )
    }
}
