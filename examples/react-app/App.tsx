import { lazy, useLocale, useTranslator } from '@traduki/react';
import { createElement as h, Suspense, useState } from 'react';
import Markdown from 'react-remarkable';
import './App.css';
import messages from './App.messages.yaml';
import logo from './logo.svg';
import otherMessages from './Other.messages.yaml';

const AsyncComponent = lazy(() => import('./Component'));

function App() {
    const [count, setCount] = useState(0);
    const t = useTranslator();
    const [, setLocale] = useLocale();

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>{t(messages.welcome)}</p>
                <p>{t(otherMessages.example)}</p>
                <p>
                    <button onClick={() => setCount(count => count + 1)}>
                        {t(messages.count, { count })}
                    </button>
                </p>
                <Suspense fallback={<div>loading...</div>}>
                    <AsyncComponent />
                </Suspense>
                <Markdown source={t(messages.edit)} />
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {t(messages.learn)}
                </a>
                <p>
                    <button onClick={() => setLocale('en')}>en</button>
                    <button onClick={() => setLocale('nl')}>nl</button>
                </p>
            </header>
        </div>
    );
}

export default App;
