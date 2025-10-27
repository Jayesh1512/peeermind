import lighthouse from '@lighthouse-web3/sdk';

interface StoredConversation {
  hash: string;
  timestamp: number;
  preview: string;
}

// Store conversation data in localStorage to keep track of all stored conversations
const STORAGE_KEY = 'lighthouse-conversations';

export const getLighthouseConversations = (): StoredConversation[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addLighthouseConversation = (hash: string, preview: string) => {
  const conversations = getLighthouseConversations();
  conversations.push({
    hash,
    timestamp: Date.now(),
    preview: preview.slice(0, 100) + '...' // Store first 100 chars as preview
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

export const storeConversation = async (messages: any[], apiKey: string) => {
  try {
    console.log('Attempting to store conversation with API key:', apiKey ? 'Present' : 'Missing');
    
    if (!apiKey) {
      throw new Error('Lighthouse API key is missing. Please check your .env.local file.');
    }

    // Group messages into conversation pairs
    const conversations = [];
    for (let i = 0; i < messages.length; i += 2) {
      if (messages[i] && messages[i + 1]) {
        conversations.push({
          user: messages[i].content,
          assistant: messages[i + 1].content
        });
      }
    }

    const conversationText = conversations
      .map((conv, index) => `Conversation ${index + 1}:\nUser: ${conv.user}\nAssistant: ${conv.assistant}`)
      .join('\n\n');

    console.log('Uploading conversation to Lighthouse...');
    const response = await lighthouse.uploadText(
      conversationText,
      apiKey,
      `conversation-${Date.now()}`
    );

    console.log('Lighthouse response:', response);

    if (response.data.Hash) {
      console.log('Successfully stored conversation with hash:', response.data.Hash);
      addLighthouseConversation(response.data.Hash, conversationText);
      return response.data.Hash;
    }
    return null;
  } catch (error) {
    console.error('Error storing conversation:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return null;
  }
};