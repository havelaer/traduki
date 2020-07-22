import React from 'react';
import ReactDOM from 'react-dom';
import { LazyLionProvider } from '@lazy-lion/react';
import './index.css';
import App from './App';

ReactDOM.render(
    <React.StrictMode>
        <LazyLionProvider initialLocale="en">
            <App />
        </LazyLionProvider>
    </React.StrictMode>,
    document.getElementById('root'),
);
