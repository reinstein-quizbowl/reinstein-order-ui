import React from 'react'
import ReactDOM from 'react-dom/client'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import './index.css'
import InvoicePage from './invoice/InvoicePage'
import OrderFlow from './order/OrderFlow'
import PacketAssignments from './packet-assignments/PacketAssignments'
import reportWebVitals from './reportWebVitals'

const router = createBrowserRouter([
	{
		path: '/',
		element: <OrderFlow />,
	},
	{
		path: '/order',
		element: <OrderFlow />,
	},
	{
		path: '/order/:creationId',
		element: <OrderFlow />,
	},
	{
		path: '/order/:creationId/invoice',
		element: <InvoicePage />,
	},
	{
		path: '/packetAssignments',
		element: <PacketAssignments />,
	},
	// TODO /admin/order/:creationId
])

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
	<React.StrictMode>
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<RouterProvider router={router} />
		</LocalizationProvider>
	</React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
