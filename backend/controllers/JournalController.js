// controllers/journalController.js
const Journal = require('../models/Journal');
const { journalSchema } = require('../validators/JournalValidator');
const { getJournalInsights } = require('../helper/groq');

exports.createJournal = async (req, res) => {
  try {
    const parseResult = journalSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.format();
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const { text } = parseResult.data;

    // Step 1: Save journal in MongoDB (using simple auth userId)
    const journal = await Journal.create({
      user: req.userId,
      text,
    });

    // Step 2: Get AI insights
    console.log('Fetching AI insights...');
    const aiInsights = await getJournalInsights(text);

    console.log('Sending embedding request to Flask...');
    const fetch = (await import('node-fetch')).default;

    const embedPayload = {
      id: `journal_${journal._id}`,
      text,
      summary: aiInsights.summary,
      userId: req.userId,
      createdAt: journal.createdAt.toISOString(),
    };

    const embedResponse = await fetch('http://localhost:6000/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embedPayload),
    });

    console.log(embedResponse.status, embedResponse);
    const embedResult = await embedResponse.json();
    console.log('Flask embed response:', embedResult);

    if (!embedResponse.ok) {
      console.error('Failed to upsert embedding:', embedResult);
      throw new Error('Failed to upsert embedding');
    }
    // Step 4: Update AI insights in MongoDB
    journal.aiInsights = aiInsights;
    await journal.save();

    res.status(201).json({ message: 'Journal saved', journal });
  } catch (err) {
    console.error('Error saving journal:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getJournals = async (req, res) => {
  try {
    console.log('getJournals called with userId:', req.userId);
    
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const totalJournals = await Journal.countDocuments({ user: req.userId });
    console.log('Total journals found:', totalJournals);

    const journals = await Journal.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log('Journals retrieved:', journals.length);

    const hasMore = skip + journals.length < totalJournals;

    res.json({ journals, hasMore });
  } catch (err) {
    console.error('Error fetching journals:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
