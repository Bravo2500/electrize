const test = require('tape');
const electronify = require('./');

test('it work!', t => {
  const result = electronify();
  t.equal(result, 42);
  t.end();
});
