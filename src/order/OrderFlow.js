import React from 'react'

import { Link, useParams } from 'react-router-dom'
import { useErrorBoundary } from 'react-error-boundary'

import { Button } from '@mui/material'

import Step1Basics from './Step1Basics'
import Step2Conference from './Step2Conference'
import Step3NonConferenceGames from './Step3NonConferenceGames'
import Step4CheckPacketAvailability from './Step4CheckPacketAvailability'
import Step5PracticeQuestions from './Step5PracticeQuestions'
import Step6Confirm from './Step6Confirm'
import Api from '../api/Api'
import { setStatePromise } from '../util/util'
import Loading from '../util-components/Loading'
import Mailto from '../util-components/Mailto'

const OrderFlow = (props) => {
    const params = useParams()
    const { showBoundary: handleError } = useErrorBoundary()

    return <OrderFlowImpl creationId={params.creationId} onError={handleError} {...props} />
}

export default OrderFlow

class OrderFlowImpl extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            year: null,
            schoolsById: null,
            packets: null,
            data: null,
            currentStep: 0,
        }
    }

    componentDidMount = async () => {
        document.title = 'Place an Order \u2013 Reinstein QuizBowl'

        await Promise.all([
            this.loadBooking(),
            this.loadCurrentYear(),
            this.loadSchools(),
            this.loadPackets(),
        ])

        this.setState({ currentStep: this.determineHighestCompletedStep() + 1 })
    }

    loadBooking = async () => {
        const { creationId, onError } = this.props
        if (creationId) {
            const data = await Api.get(`/bookings/${creationId}`, onError)
            await setStatePromise(this, { data })
        }
    }

    loadCurrentYear = async () => {
        const { onError } = this.props

        if (this.state.year) return

        const year = await Api.get('/years/current', onError)
        await setStatePromise(this, { year })
    }

    loadSchools = async () => {
        const { onError } = this.props

        if (this.state.schoolsById) return

        const schools = await Api.get('/schools/active', onError)
        const schoolsById = {}
        for (const school of schools) {
            schoolsById[school.id] = school
        }

        await setStatePromise(this, { schoolsById })
    }

    loadPackets = async () => {
        const { onError } = this.props

        if (this.state.packets) return

        const packets = await Api.get(`/packets?filter=availableForCompetition`, onError)
        await setStatePromise(this, { packets })
    }

    // If you already have the data, just pass it in. Otherwise, this will do its own load.
    handleReloadData = async (data) => {
        const { onError } = this.props

        if (data) {
            await setStatePromise(this, { data })
        } else {
            const { creationId } = this.state.data
            
            const updated = await Api.get(`/bookings/${creationId}`, onError)
            await setStatePromise(this, { data: updated })
        }

        await setStatePromise(this, { currentStep: this.determineHighestCompletedStep() + 1 })
    }

    determineHighestCompletedStep = () => {
        const { data } = this.state

        if (!data) return 0

        const conferencePacketsAssigned = data.conference && data.conference.assignedPackets && data.conference.assignedPackets.length > 0
        const nonConferenceGamePacketsAssigned = data.nonConferenceGames && data.nonConferenceGames.some(it => !!it.assignedPacket)

        if ((data.packetOrders && data.packetOrders.length > 0) || (data.compilationOrders && data.compilationOrders.length > 0)) {
            // They could also have declined to order practice questions. We don't currently have a way to capture that.
            return 5
        }

        if (conferencePacketsAssigned || nonConferenceGamePacketsAssigned) {
            return 4
        }

        if (data.nonConferenceGames && data.nonConferenceGames.length > 0) {
            // They could also have said they don't have non-conference games. We don't currently have a way to capture that.
            return 3
        }

        if (data.conference) {
            // They could also have said they're not ordering for a conference. We don't currently have a way to capture that.
            return 2
        }

        if (data.school && data.name && data.emailAddress && data.authority) {
            return 1
        }

        return 0
    }

    handleGoToStep = async (targetStep) => {
        const { onError } = this.props
        const { data, currentStep } = this.state

        if (data.invoiceLines && data.invoiceLines.length > 0 && targetStep < 6) {
            // They're going to a step before the invoice was calculated, so it is presumed they will make changes that will eventually necessitate recalculation of the invoice. We delete the invoice for now.
            await Api.delete(`/bookings/${data.creationId}/invoice`, onError)
        }

        if (currentStep >= 4 && targetStep < 4) {
            // They're going to a step before the packets were assigned, so it is presumed they will make steps that will eventually necessitate reassignment of packets. We delete the assignments for now.
            await Api.delete(`/bookings/${data.creationId}/packetAssignments`, onError)
        }

        this.setState({ currentStep: targetStep })
    }

    handleStepExpansionToggle = targetStep => (event, isExpanded) => this.handleGoToStep(targetStep)
    
    render() {
        const { creationId, onError } = this.props
        const { year, schoolsById, packets, data, currentStep } = this.state

        const missingBooking = creationId && !data
        if (missingBooking || !year || !schoolsById || !packets) {
            return <Loading />
        }

        if (data && data.statusCode !== 'unsubmitted') {
            if (data.statusCode === 'submitted') {
                document.title = 'Order Received \u2013 Reinstein QuizBowl'
                return (
                    <>
                        <p>Thank you for your order!</p>
                        <p>We will be in touch soon. If you have any questions or concerns, please write to <Mailto />.</p>
                        <Link to={`/order/${data.creationId}/invoice`}>
                            <Button variant="contained">   
                                View Invoice
                            </Button>
                        </Link>
                    </>
                )
            } else {
                return (
                    <>
                        <p>This order has already been submitted and cannot be changed now.</p>
                        <p>If you made a mistake or have any questions or concerns, write to <Mailto />.</p>
                    </>
                )
            }
        }

        const highestCompletedStep = this.determineHighestCompletedStep()
        const highestSeenStep = Math.max(currentStep, highestCompletedStep)
        const hasAssignedPackets = highestCompletedStep >= 4

        const stepProps = {
            currentStep,
            highestSeenStep,
            onGoToStep: this.handleGoToStep,
            year,
            schoolsById,
            packets,
            data,
            dataReloader: this.handleReloadData,
            onError,
        }

        return (
            <>
                <Step1Basics
                    onToggleExpansion={hasAssignedPackets || highestSeenStep < 1 ? null : this.handleStepExpansionToggle(1)}
                    {...stepProps}
                />
                <Step2Conference
                    onToggleExpansion={hasAssignedPackets || highestSeenStep < 2 ? null : this.handleStepExpansionToggle(2)}
                    {...stepProps}
                />
                <Step3NonConferenceGames
                    onToggleExpansion={hasAssignedPackets || highestSeenStep < 3 ? null : this.handleStepExpansionToggle(3)}
                    {...stepProps}
                />
                <Step4CheckPacketAvailability
                    onToggleExpansion={hasAssignedPackets || highestSeenStep < 4 ? null : this.handleStepExpansionToggle(4)}
                    {...stepProps}
                />
                <Step5PracticeQuestions
                    onToggleExpansion={highestSeenStep < 5 ? null : this.handleStepExpansionToggle(5)}
                    {...stepProps}
                />
                <Step6Confirm
                    onToggleExpansion={null}
                    {...stepProps}
                />
            </>
        )
    }
}
