// Run: node --experimental-strip-types src/lib/start-code.check.ts
import assert from 'node:assert/strict';

import { codeFromChat } from './start-code.ts';

const c = (message: string) => ({ sender_type: 'citizen', message });
const p = (message: string) => ({ sender_type: 'partner', message });

assert.equal(codeFromChat([c('my code is 4821')]), '4821');
assert.equal(codeFromChat([c('4 8 2 1')]), '4821', 'spaced digits');
assert.equal(codeFromChat([c('code 1111'), c('sorry, it is 4821')]), '4821', 'newest citizen message wins');
assert.equal(codeFromChat([c('4821'), p('please send 9999')]), '4821', "the centre's own messages are ignored");
assert.equal(codeFromChat([c('call me on 9848012345')]), null, 'phone numbers are not codes');
assert.equal(codeFromChat([c('pincode 500081')]), null, 'PIN codes are not codes');
assert.equal(codeFromChat([c('reaching by 10:30')]), null);
assert.equal(codeFromChat([]), null);

console.log('start-code: ok');
