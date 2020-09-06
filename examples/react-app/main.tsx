import { TradukiProvider } from '@traduki/react';
import { createElement as h } from 'react';
import { render } from 'react-dom';
import App from './App';
import './index.css';

render(
    <TradukiProvider initialLocale="en">
        <App />
    </TradukiProvider>,
    document.getElementById('root'),
);
