import React from 'react'
import ReactDOM from 'react-dom/client'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import './index.css'
import ErrorBoundary from './error/ErrorBoundary'
import NotFound from './error/NotFound'
import RouterErrorBoundary from './error/RouterErrorBoundary'
import InvoicePage from './invoice/InvoicePage'
import OrderFlow from './order/OrderFlow'
import PacketAssignments from './packet-assignments/PacketAssignments'
import Loading from './util-components/Loading'
import reportWebVitals from './reportWebVitals'

const router = createBrowserRouter([
	{
		path: '/',
		element: <OrderFlow />,
		ErrorBoundary: RouterErrorBoundary,
	},
	{
		path: '/order',
		element: <OrderFlow />,
		ErrorBoundary: RouterErrorBoundary,
	},
	{
		path: '/order/:creationId',
		element: <OrderFlow />,
		ErrorBoundary: RouterErrorBoundary,
	},
	{
		path: '/order/:creationId/invoice',
		element: <InvoicePage />,
		ErrorBoundary: RouterErrorBoundary,
	},
	{
		path: '/packetAssignments',
		element: <PacketAssignments />,
		ErrorBoundary: RouterErrorBoundary,
	},
	{
		path: '*',
		element: <NotFound />,
	}
	// TODO /admin/order/:creationId
])

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
	<React.StrictMode>
		<ErrorBoundary>
			<LocalizationProvider dateAdapter={AdapterDayjs}>
				<RouterProvider router={router} fallbackElement={<Loading />} />
			</LocalizationProvider>
		</ErrorBoundary>
	</React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
