/**
 * Frontend Integration Example
 * 
 * How to use the Smart Chat API with Decision Agent
 */

import api from '@/lib/api';

/**
 * Smart Chat Function - Automatically routes to best handler
 * @param {string} message - User's query
 * @param {boolean} includeHistory - Include recent chat history
 * @returns {Promise<Object>} Response with category and message
 */
export async function smartChat(message: string, includeHistory = true) {
  try {
    const response = await api.post('/api/smart-chat', {
      message,
      includeHistory,
      topK: 5, // For RAG queries
    });

    return {
      success: response.data.success,
      message: response.data.message,
      category: response.data.category,
      contextUsed: response.data.contextUsed,
      needsClarification: response.data.needsClarification,
    };
  } catch (error: any) {
    console.error('Smart chat error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test Classification - See how a query would be classified
 * @param {string} query - Test query
 * @returns {Promise<string>} Category name
 */
export async function testClassification(query: string) {
  try {
    const response = await api.post('/api/smart-chat/test-classify', { query });
    return response.data.category;
  } catch (error: any) {
    console.error('Classification test error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example Usage in Component
 * 
 * This is a code example showing how to integrate smart chat.
 * To use this, you would need to:
 * 1. Import React hooks: useState
 * 2. Import a toast library or UI component
 * 3. Create proper state management
 */
/*
export function ExampleUsage() {
  const [loading, setLoading] = useState(false);
  
  const handleUserMessage = async (userInput: string) => {
    try {
      // Show loading state
      setLoading(true);
      
      // Send to smart chat endpoint
      const result = await smartChat(userInput, true);
      
      // Handle different response types
      if (result.needsClarification) {
        // Show clarification UI
        console.log(result.message);
      } else if (result.category === 'ACTION_QUERY') {
        // Show action confirmation
        console.log('Action detected: ' + result.message);
      } else {
        // Normal response
        console.log(result.message);
      }
      
      // Optional: Show what type of query it was
      console.log(`Query type: ${result.category}`);
      console.log(`Used context: ${result.contextUsed}`);
      
    } catch (error) {
      console.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <input 
        onChange={(e) => handleUserMessage(e.target.value)} 
        placeholder="Ask me anything..."
      />
    </div>
  );
}
*/

/**
 * Advanced: Show category badge in UI
 */
export function getCategoryBadge(category: string) {
  const badges: Record<string, { emoji: string; label: string; color: string }> = {
    RAG_QUERY: { emoji: '📚', label: 'Knowledge Base', color: 'blue' },
    CHAT_QUERY: { emoji: '💬', label: 'Chat', color: 'green' },
    ACTION_QUERY: { emoji: '⚙️', label: 'Action', color: 'orange' },
    CLARIFICATION: { emoji: '❓', label: 'Needs Clarification', color: 'gray' },
  };
  
  return badges[category] || badges.CHAT_QUERY;
}
