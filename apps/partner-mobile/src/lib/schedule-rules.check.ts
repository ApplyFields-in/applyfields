// Run: node --experimental-strip-types apps/partner-mobile/src/lib/schedule-rules.check.ts
import assert from 'node:assert/strict';

import { copyMondayToWeekdays, scheduleProblem } from './schedule-rules.ts';

const day = { dayOfWeek: 1, dayName: 'Monday', isOpen: true, openTime: '09:00', closeTime: '18:00', hasBreak: false };

assert.equal(scheduleProblem([day]), null);
assert.equal(scheduleProblem([{ ...day, isOpen: false, openTime: 'junk' }]), null, 'closed days are not checked');
assert.match(scheduleProblem([{ ...day, openTime: '9:00' }])!, /HH:MM/);
assert.match(scheduleProblem([{ ...day, closeTime: '08:00' }])!, /after opening/);
assert.equal(scheduleProblem([{ ...day, hasBreak: true, breakStart: '13:00', breakEnd: '14:00' }]), null);
assert.match(scheduleProblem([{ ...day, hasBreak: true, breakStart: '13:00', breakEnd: null }])!, /break start and end/);
assert.match(scheduleProblem([{ ...day, hasBreak: true, breakStart: '08:00', breakEnd: '10:00' }])!, /inside opening hours/);
assert.match(scheduleProblem([{ ...day, hasBreak: true, breakStart: '14:00', breakEnd: '13:00' }])!, /inside opening hours/);
const week = [0, 1, 2, 5, 6].map((dow) => ({ ...day, dayOfWeek: dow, openTime: dow === 1 ? '08:30' : '10:00', isOpen: dow !== 0 }));
const copied = copyMondayToWeekdays(week);
assert.deepEqual(copied.map((d) => d.openTime), ['10:00', '08:30', '08:30', '08:30', '10:00'], 'Tue–Fri follow Monday, Sat/Sun keep theirs');
assert.equal(copied[0].isOpen, false, 'Sunday stays closed');
console.log('schedule-rules: ok');
