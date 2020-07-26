import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TradukiProvider } from '@traduki/react';
import './index.css';
import App from './App';

const Main = () => (
    <TradukiProvider initialLocale="en">
        <App />
    </TradukiProvider>
);

ReactDOM.render(
    <React.StrictMode>
        <Main />
    </React.StrictMode>,
    document.getElementById('root'),
);
