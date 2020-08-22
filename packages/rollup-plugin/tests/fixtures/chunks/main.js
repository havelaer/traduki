import messagesA from './a.messages.yaml';
import messagesB from './b.messages.yaml';
import messagesCommon from './common.messages.yaml';

import('./other'); // creates new chunk

console.log(messagesA.keyA1);
console.log(messagesA.keyA2);
console.log(messagesB.keyB1);
console.log(messagesB.keyB3);
console.log(messagesCommon.keyCommon1);
console.log(messagesCommon.keyCommon2);
