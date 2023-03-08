import axios from 'axios';
import { Activity } from 'botframework-directlinejs';

export const verifyConversation = (
    baseUrl: string,
    msftConversationId: string,
    msftUserId: string,
    directLine: string,
    originatingUrl: string,
    campaignParams: object
): any => {
    return axios.post(`${baseUrl}/api/v1/bot/conversations`, {
        msft_conversation_id: msftConversationId,
        originating_url: originatingUrl,
        msft_user_id: msftUserId,
        directLine,
        campaignParams
    });
};

export const step = (
    baseUrl: string,
    msftConversationId: string,
    directLine: string,
    messageId: string
): any => {
    return axios.post(`${baseUrl}/api/v1/bot/step`, {
        msft_conversation_id: msftConversationId,
        directLine,
        message_id: messageId
    });
};

export const conversationHistory = (
    baseUrl: string,
    directLine: string,
    conversationId: string,
    lastMessageId: string = null
): any => {
    return axios.get(`${baseUrl}/api/v1/conversations/history?conversation_id=${conversationId}&directLine=${directLine}&last=${lastMessageId}`);
};

export const ping = (
    baseUrl: string,
    msftConversationId: string,
    directLine: string
): any => {
    return axios.post(`${baseUrl}/api/v1/leads/ping`, {
        msft_conversation_id: msftConversationId,
        directLine
    });
};

export const availableTimes = (
    baseUrl: string,
    directLine: string,
    conversationId: string,
    startDate: string
): any => {
    return axios.get(`${baseUrl}/api/v1/availabilities/available_times?directLine=${directLine}&conversation_id=${conversationId}&start_date=${startDate}`);
};

export const mapMessagesToActivities = (messages: any, userId: any): Activity[] => {
    return messages.map((m: any, i: number) => {
        return {
            id: m.id,
            type: 'message',
            entities: m.entities,
            suggestedActions: m.suggestedActions,
            from: {
                id: m.sender_type === 'bot' ? '' : userId
            },
            text: m.message
        };
    });
};

// checkNeedBackButton - checks if the current activity corresponds to acompletion node, returns a boolean
export const checkNeedBackButton = async (baseUrl: string, directLine: string, msftConversationId: string, messageText: string): Promise<any> => {
    const temp = axios.get(`${baseUrl}/api/v1/bot/checkbackbutton?msft_conversation_id=${msftConversationId}&directLine=${directLine}`);
    const attempt = (await temp).data
    return attempt;
};

//
export const conversationList = (
    baseUrl: string,
    user_id: string,
    convo_id: string
): any => {
    return axios.get(`${baseUrl}/api/v1/conversations/list?user_id=${user_id}&convo_id=${convo_id}`);
}

//sends signature from esign card to populate document, expects signed document in return?
export const sendSignature = (
    baseUrl: string,
    directLine: string,
    conversationId: string,
    signature: string,
    document: string,
    initials: string
): any => {
   return axios.post(`${baseUrl}/api/v1/bot/esign`, {
       link: document,
       signature: signature,
       msft_conversation_id: conversationId
   })


}

