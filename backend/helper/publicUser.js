// helper/publicUser.js
// Provides a single shared demo user for public (unauthenticated) usage.
const User = require('../models/User');

const DEMO_EMAIL = 'public@demo.local';

async function getPublicUser() {
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({ email: DEMO_EMAIL, name: 'Public Demo User' });
  }
  return user;
}

async function getPublicUserId() {
  const user = await getPublicUser();
  return user._id;
}

module.exports = { getPublicUser, getPublicUserId };
