import { createTheme } from '@mui/material'

export const theme = createTheme({
    palette: {
        primary: {
            main: '#1e73be', // This matches the color on the Wordpress theme for reinsteinquizbowl.com. It's very close to the MUI default theme color anyway, so we don't customize the secondary color or anything else.
            light: '#51a6f1',
            dark: '#00408b',
        },
        error: { main: '#dc143c' },
        warning: { main: '#daa520' },
        success: { main: '#008000' },
    },
    typography: {
        allVariants: { color: '#222222' },
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        h2: { fontWeight: 500 },
    },
    components: {
        MuiFormLabel: {
            styleOverrides: {
                root: {
                    fontWeight: '600',
                },
            },
        },
    },
})
