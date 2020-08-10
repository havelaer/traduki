import traduki from '@traduki/runtime';
import messagesC from './c.messages.yaml';

traduki.load().then(() => {
    const root2 = document.getElementById('root2');

    if (!root2) return;

    // @ts-ignore
    root2.innerHTML = `
        ${traduki.translate(messagesC.example)}\n
    `
});