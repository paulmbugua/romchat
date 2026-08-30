import assert from 'node:assert/strict';
import test from 'node:test';
import { publicErrorMessage, sanitizeErrorPayload } from './publicError.js';

test('removes internal diagnostics from public messages', () => {
  const message = 'Check the backend console for [utamu:login] using masked login pa**2@gmail.com.';
  assert.equal(publicErrorMessage(message, 500), 'Something went wrong on our side. Please try again shortly.');
});

test('preserves useful validation errors', () => {
  assert.equal(publicErrorMessage('A valid email is required.', 400), 'A valid email is required.');
});

test('removes sensitive fields from server failures', () => {
  assert.deepEqual(
    sanitizeErrorPayload({ message: 'postgres connection failed', stack: 'secret', details: 'database host' }, 500),
    { message: 'Something went wrong on our side. Please try again shortly.' },
  );
});
