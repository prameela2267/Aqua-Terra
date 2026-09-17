const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Auth Security Primitives', () => {
  test('Password should be securely hashed and verified with bcrypt', async () => {
    const rawPassword = 'FarmerSecret@2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    const isValid = await bcrypt.compare(rawPassword, hash);
    expect(isValid).toBe(true);

    const isWrongValid = await bcrypt.compare('WrongPassword', hash);
    expect(isWrongValid).toBe(false);
  });

  test('JWT signing and verification should encode and decode user payload', () => {
    const secret = 'test_jwt_secret_key_123';
    const userId = '60d5ec49f1b2c8b1f8e4e1a1';
    const token = jwt.sign({ id: userId }, secret, { expiresIn: '1h' });

    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(userId);
  });
});
