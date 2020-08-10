import React, { useState, lazy, Suspense } from 'react';
import { useTranslator, useLocale } from '@traduki/react';
import messages from './App.messages.yaml';
import otherMessages from './Other.messages.yaml';
// import logo from './logo.svg';
import './App.css';

// const messages: any = {};

// const AsyncComponent = lazy(() => import('./Component'));

function App() {
    const [count, setCount] = useState(0);
    const t = useTranslator();
    const [, setLocale] = useLocale();

    return (
        <div className="App">
            <header className="App-header">
                {/* <img src={logo} className="App-logo" alt="logo" /> */}
                <p>{t(messages.welcome)}</p>
                <p>{t(otherMessages.example)}</p>
                <p>
                    <button onClick={() => setCount(count => count + 1)}>
                        {t(messages.count, { count })}
                    </button>
                </p>
                <Suspense fallback={<div>loading...</div>}>
                    {/* <AsyncComponent /> */}
                </Suspense>
                <p dangerouslySetInnerHTML={{ __html: t.markdown(messages.edit) }} />
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
