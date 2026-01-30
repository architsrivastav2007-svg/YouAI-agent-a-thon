const redis = require('../helper/redisClient');
const { sendOTP } = require('../helper/mailer');
const { emailSchema } = require('../validators/LoginValidation');

const handleLogin = async (req, res) => {
  try {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { email } = parsed.data;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis with 5-minute expiry
    await redis.setex(`otp:${email}`, 300, otp);

    // Send OTP via email
    try {
      await sendOTP(email, otp);
    } catch (emailError) {
      // In development, log OTP to console if email fails
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n⚠️  EMAIL SENDING FAILED - DEVELOPMENT MODE');
        console.log('═══════════════════════════════════════════');
        console.log(`🔑 OTP for ${email}: ${otp}`);
        console.log('⏰ Valid for: 5 minutes');
        console.log('═══════════════════════════════════════════\n');
        // Continue without throwing error in dev mode
      } else {
        // In production, clean up and return error
        await redis.del(`otp:${email}`);
        return res.status(500).json({ 
          error: 'Failed to send OTP. Please try again.' 
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { handleLogin };
