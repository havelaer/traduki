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

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>{t(messages.welcome)}</p>
                <p>
                    <button onClick={() => setCount(count => count + 1)}>
                        {t(messages.count, { count })}
                    </button>
                </p>
                <Suspense fallback={<div>loading...</div>}>
                    <AsyncComponent />
                </Suspense>
                <div dangerouslySetInnerHTML={{ __html: marked(t(messages.edit)) }} />
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {t(messages.learn)}
                </a>
                <p>
                    <button onClick={() => setLocale('en-US')}>en</button>
                    <button onClick={() => setLocale('nl-NL')}>nl</button>
                </p>
            </header>
        </div>
    );
}

export default App;
