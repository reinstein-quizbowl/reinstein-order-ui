export const setStatePromise = (component, newState) => new Promise(resolve => component.setState(newState, resolve));

export const SENTINEL_NULL_DATE = '1900-01-01'

export const isBoolean = value => value === true || value === false

export const makeEnglishList = (values, conjunction = 'and') => {

    if (!values || values.length === 0) return null

    if (values.length === 1) return values[0]

    if (values.length === 2) return `${values[0]} ${conjunction} ${values[1]}`

    const valueStrings = values.map(it => it.toString())

    const punctuation = valueStrings.some(it => it.includes(',')) ? '; ' : ', '
    return valueStrings.slice(0, valueStrings.length - 1).join(punctuation + ' ') + punctuation + conjunction + ' ' + valueStrings[valueStrings.length - 1]
}

export const formatMoney = (amount, alwaysShowDecimals = false) => {
    const amountNumber = Number(amount)

    let formattedNumber
    if (alwaysShowDecimals || !Number.isInteger(amountNumber)) {
        formattedNumber = Math.abs(amountNumber).toFixed(2)
    } else {
        formattedNumber = Math.abs(amountNumber).toString()
    }

    if (amountNumber >= 0) {
        return '$' + formattedNumber
    } else {
        return '\u2212$' + formattedNumber
    }
}
