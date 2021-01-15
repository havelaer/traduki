import { TradukiProvider } from '@traduki/preact';
import { createElement as h } from 'preact/compat';
import { render } from 'preact';
import App from './App';
import './index.css';

render(
    <TradukiProvider initialLocale="en">
        <App />
    </TradukiProvider>,
    document.getElementById('root')!,
);
