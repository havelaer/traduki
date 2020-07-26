import React from 'react';
import ReactDOM from 'react-dom';
import { TradukiProvider } from '@traduki/react';
import './index.css';
import App from './App';

ReactDOM.render(
    <React.StrictMode>
        <TradukiProvider initialLocale="en">
            <App />
        </TradukiProvider>
    </React.StrictMode>,
    document.getElementById('root'),
);
