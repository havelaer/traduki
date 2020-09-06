import { useTranslator } from '@traduki/react';
import { createElement as h } from 'react';
import './App.css';
import messages from './Component.messages.yaml';

function Component() {
    const t = useTranslator();

    return <span style={{ border: '1px solid red' }}>{t(messages.async)}</span>;
}

export default Component;
