import React from 'react'

import { Autocomplete, Box, TextField } from '@mui/material'

import Mailto from './Mailto'

const MILES_PER_DEGREE = 24901.0 / 360.0

export const renderDistance = (school1, school2) => {
    if (!school1 || !school1.latitude || !school1.longitude) return null
    if (!school2 || !school2.latitude || !school2.longitude) return null

    const lat1 = school1.latitude
    const lon1 = school1.longitude

    const lat2 = school2.latitude
    const lon2 = school2.longitude

    const avgLatitudeDegrees = (lat1 + lat2) / 2.0
    const avgLatitudeRadians = avgLatitudeDegrees * Math.PI / 180.0
    const latitudeDifference = lat2 - lat1
    const longitudeDifference = lon2 - lon1
    
    const distance = Math.sqrt((latitudeDifference * latitudeDifference + Math.sin(avgLatitudeRadians) * (longitudeDifference * longitudeDifference))) * MILES_PER_DEGREE
    const distanceRounded = Math.round(distance)

    if (distanceRounded === 0) return '0 miles away'
    if (distanceRounded === 1) return '1 mile away'
    if (distanceRounded <= 40) return `${distanceRounded} miles away`
    if (distanceRounded <= 100) return <span className="form-warning">{distanceRounded} miles away</span>
    return <span className="form-error">{distanceRounded} miles away</span>
}

// For reasons I haven't quite figured out, sometimes this is called with an ApiSchool and sometimes with just an ID.
const renderOptionLabel = (option, allSchools) => {
    if (!option) return ''

    if (option && option.shortName) {
        return option.shortName
    }

    const foundSchool = allSchools.find(it => it.id === option)
    if (foundSchool && foundSchool.shortName) {
        return foundSchool.shortName
    }

    console.warn("Couldn't find school", option)
    return ''
}

const byShortName = (a, b) => a.shortName.localeCompare(b.shortName)

const SchoolPicker = props => {
    let helperText = null
    if (props.helperText) {
        helperText = props.helperText
    } else if (props.showAddSchoolHelperText) {
        helperText = <>If you want to add a school that is not listed, please write to <Mailto />.</>
    }

    return (
        <Autocomplete
            id={props.id || 'school'}
            value={props.value}
            autoSelect
            blurOnSelect
            clearOnBlur
            options={props.schools.sort(byShortName)}
            onChange={(_, school) => props.onChange(school.id)}
            autoHighlight
            getOptionLabel={option => renderOptionLabel(option, props.schools)}
            renderOption={(optionProps, school) => (
                <Box key={school.id} component="li" className="school-picker-option" {...optionProps}>
                    <div className="school-picker-option">
                        <div className="school-picker-option-main">{school.shortName}</div>
                        <div className="school-picker-option-secondary">
                            {school.name}, {school.city}, {school.state}
                        </div>
                        {props.showDistanceFrom && (
                            <div className="school-picker-option-secondary">
                                {renderDistance(props.showDistanceFrom, school)}
                            </div>
                        )}
                    </div>
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={props.label}
                    helperText={helperText}
                    placeholder={props.placeholder}
                    inputProps={{
                        ...params.inputProps,
                        autoComplete: 'new-password', // disable autocomplete and autofill
                        className: 'input',
                    }}
                    autoFocus={props.autoFocus}
                />
            )}
        />
    )
}

export default SchoolPicker
