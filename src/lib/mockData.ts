import { User, Conversation, Message } from '../types';

export const MOCK_CURRENT_USER: User = {
  id: 'usr_me_1',
  name: 'Alex Mercer',
  phone: '+15551234567',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  createdAt: new Date().toISOString(),
};

export const MOCK_USERS: User[] = [
  MOCK_CURRENT_USER,
  {
    id: 'usr_2',
    name: 'Sarah Connor',
    phone: '+15559876543',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_3',
    name: 'David Miller',
    phone: '+15552468101',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_4',
    name: 'Elena Rostova',
    phone: '+15551357913',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_5',
    name: 'Marcus Vance',
    phone: '+15553692581',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv_direct_1': [
    {
      id: 'msg_101',
      conversationId: 'conv_direct_1',
      senderId: 'usr_2',
      sender: MOCK_USERS[1],
      text: 'Hey Alex! Have you reviewed the Next.js 15 App Router architecture strategy?',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: 'sent',
    },
    {
      id: 'msg_102',
      conversationId: 'conv_direct_1',
      senderId: 'usr_me_1',
      sender: MOCK_CURRENT_USER,
      text: 'Yes Sarah! The design system with Tailwind v4 and threshold scroll lock works seamlessly.',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'sent',
    },
    {
      id: 'msg_103',
      conversationId: 'conv_direct_1',
      senderId: 'usr_2',
      sender: MOCK_USERS[1],
      text: 'Awesome! Real-time Socket.io state synchronization feels instantaneous.',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'sent',
    },
  ],
  'conv_group_1': [
    {
      id: 'msg_201',
      conversationId: 'conv_group_1',
      senderId: 'usr_3',
      sender: MOCK_USERS[2],
      text: 'Welcome everyone to the Core Engineering Group!',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      status: 'sent',
    },
    {
      id: 'msg_202',
      conversationId: 'conv_group_1',
      senderId: 'usr_4',
      sender: MOCK_USERS[3],
      text: 'I pushed the OpenAPI 3.1 specification files to /docs/openapi.yaml.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      status: 'sent',
    },
    {
      id: 'msg_203',
      conversationId: 'conv_group_1',
      senderId: 'usr_me_1',
      sender: MOCK_CURRENT_USER,
      text: 'Great work Elena! Evaluators can inspect the network simulator on the landing page.',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: 'sent',
    },
  ],
};

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_direct_1',
    type: 'direct',
    name: null,
    participants: [MOCK_CURRENT_USER, MOCK_USERS[1]],
    lastMessage: MOCK_MESSAGES['conv_direct_1'][MOCK_MESSAGES['conv_direct_1'].length - 1],
    updatedAt: MOCK_MESSAGES['conv_direct_1'][MOCK_MESSAGES['conv_direct_1'].length - 1].createdAt,
    unreadCount: 0,
  },
  {
    id: 'conv_group_1',
    type: 'group',
    name: 'Frontend Core Architecture',
    participants: [MOCK_CURRENT_USER, MOCK_USERS[2], MOCK_USERS[3], MOCK_USERS[4]],
    adminIds: ['usr_me_1', 'usr_3'],
    lastMessage: MOCK_MESSAGES['conv_group_1'][MOCK_MESSAGES['conv_group_1'].length - 1],
    updatedAt: MOCK_MESSAGES['conv_group_1'][MOCK_MESSAGES['conv_group_1'].length - 1].createdAt,
    unreadCount: 1,
  },
];
