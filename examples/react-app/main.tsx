import { createElement as h } from 'react';
import * as ReactDOM from 'react-dom';
import { TradukiProvider } from '@traduki/react';
import './index.css';
import App from './App';

ReactDOM.render(
    <TradukiProvider initialLocale="en">
        <App />
    </TradukiProvider>,
    document.getElementById('root'),
);
