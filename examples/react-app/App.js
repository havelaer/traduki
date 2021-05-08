import { useLocale, useTranslator, waitForMessages } from '@traduki/preact';
import { createElement as h, Suspense, useState, lazy } from 'preact/compat';
import marked from 'marked';
import './App.css';
import messages from './App.messages.yaml';
import logo from './logo.svg';
const AsyncComponent = lazy(() => import('./Component').then(waitForMessages));
function App() {
    const [count, setCount] = useState(0);
    const t = useTranslator();
    const [, setLocale] = useLocale();
    return (h("div", { className: "App" },
        h("header", { className: "App-header" },
            h("img", { src: logo, className: "App-logo", alt: "logo" }),
            h("p", null, t(messages.welcome)),
            h("p", null,
                h("button", { onClick: () => setCount(count => count + 1) }, t(messages.count, { count }))),
            h(Suspense, { fallback: h("div", null, "loading...") },
                h(AsyncComponent, null)),
            h("div", { dangerouslySetInnerHTML: { __html: marked(t(messages.edit)) } }),
            h("a", { className: "App-link", href: "https://reactjs.org", target: "_blank", rel: "noopener noreferrer" }, t(messages.learn)),
            h("p", null,
                h("button", { onClick: () => setLocale('en') }, "en"),
                h("button", { onClick: () => setLocale('nl') }, "nl")))));
}
export default App;
