import { useTranslator } from '@traduki/preact';
import { createElement as h } from 'preact/compat';
import './App.css';
import messages from './Component.messages.yaml';
function Component() {
    const t = useTranslator();
    return h("span", { style: { border: '1px solid red' } }, t(messages.async));
}
export default Component;
