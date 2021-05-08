import { TradukiProvider } from '@traduki/preact';
import { createElement as h } from 'preact/compat';
import { render } from 'preact';
import App from './App';
import './index.css';
render(h(TradukiProvider, { initialLocale: "en" },
    h(App, null)), document.getElementById('root'));
