import React, { useState } from 'react';
import { useTranslations, useLocale } from '@lazy-lion/react';
import messages from './App.messages.yaml';
import logo from './logo.svg';
import './App.css';

function App() {
    const [count, setCount] = useState(0);
    const t = useTranslations();
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
