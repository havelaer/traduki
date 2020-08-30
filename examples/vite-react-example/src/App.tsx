import { useLocale, useTranslator } from '@traduki/react';
import React, { useState } from 'react';
import Markdown from 'react-remarkable';
import './App.css';
import messages from './App.messages.yaml';
import logo from './logo.svg';

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
