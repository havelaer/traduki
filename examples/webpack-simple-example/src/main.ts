import traduki from '@traduki/runtime';
import messagesA from './a.messages.yaml';
import messagesB from './b.messages.yaml';
import d from './d';

import('./c');

traduki.setLocale('en').load().then(() => {
    const root = document.getElementById('root');

    if (!root) return;

    // @ts-ignore
    root.innerHTML = `
        ${traduki.translate(messagesA.welcome)}\n
        ${traduki.translate(messagesA.count, { count: 12 })}\n
        ${traduki.translate(messagesB.example)}\n
        ${traduki.translate(d.example)}\n
    `
});
