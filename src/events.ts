// 事件类型与载荷解析。
//
// 数值/名称顺序必须与 goim-sdk-core pkg/events/event.go、
// pkg/call/handler.go 的 eventTypeNames 严格一致。

export const EventType = {
  NewMsg: 1,
  RevokeMsg: 2,
  DeleteMsgs: 3,
  MarkAsRead: 4,
  ConversationUpdate: 5,
  ConversationDelete: 6,
  FriendApplication: 7,
  FriendApplicationApproved: 8,
  FriendApplicationRejected: 9,
  FriendAdded: 10,
  FriendDeleted: 11,
  FriendInfoChanged: 12,
  BlackAdded: 13,
  BlackDeleted: 14,
  GroupCreated: 15,
  GroupInfoSet: 16,
  JoinGroupApplication: 17,
  GroupApplicationAccepted: 18,
  GroupApplicationRejected: 19,
  MemberEnter: 20,
  MemberInvited: 21,
  MemberQuit: 22,
  MemberKicked: 23,
  GroupOwnerTransferred: 24,
  GroupDismissed: 25,
  GroupMemberMuted: 26,
  GroupMemberCancelMuted: 27,
  GroupMuted: 28,
  GroupCancelMuted: 29,
  UserInfoUpdated: 30,
  UserStatusChange: 31,
  ForceLogout: 32,
  BackgroundStatusChanged: 33,
  Connect: 34,
  Connecting: 35,
  Disconnect: 36,
  Reconnect: 37,
  LoginSuccess: 38,
  LoginFailed: 39,
  TokenRefreshed: 40,
  SyncStart: 41,
  SyncFinish: 42,
  SyncFailed: 43,
  SeqSynced: 44,
  FriendListSynced: 45,
  BlackListSynced: 46,
  GroupListSynced: 47,
  GroupMemberSynced: 48,
  ConversationSynced: 49,
  MsgSent: 50,
  MsgRevoked: 51,
  GroupMemberInvited: 52,
  ConversationCreated: 53,
  TokenRefreshFailed: 54,
} as const;

export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

// index 与 EventType 数值一一对应（0 位占位），与 Go 侧 eventTypeNames 同序
export const EVENT_NAMES: readonly string[] = [
  '',
  'EventNewMsg',
  'EventRevokeMsg',
  'EventDeleteMsgs',
  'EventMarkAsRead',
  'EventConversationUpdate',
  'EventConversationDelete',
  'EventFriendApplication',
  'EventFriendApplicationApproved',
  'EventFriendApplicationRejected',
  'EventFriendAdded',
  'EventFriendDeleted',
  'EventFriendInfoChanged',
  'EventBlackAdded',
  'EventBlackDeleted',
  'EventGroupCreated',
  'EventGroupInfoSet',
  'EventJoinGroupApplication',
  'EventGroupApplicationAccepted',
  'EventGroupApplicationRejected',
  'EventMemberEnter',
  'EventMemberInvited',
  'EventMemberQuit',
  'EventMemberKicked',
  'EventGroupOwnerTransferred',
  'EventGroupDismissed',
  'EventGroupMemberMuted',
  'EventGroupMemberCancelMuted',
  'EventGroupMuted',
  'EventGroupCancelMuted',
  'EventUserInfoUpdated',
  'EventUserStatusChange',
  'EventForceLogout',
  'EventBackgroundStatusChanged',
  'EventConnect',
  'EventConnecting',
  'EventDisconnect',
  'EventReconnect',
  'EventLoginSuccess',
  'EventLoginFailed',
  'EventTokenRefreshed',
  'EventSyncStart',
  'EventSyncFinish',
  'EventSyncFailed',
  'EventSeqSynced',
  'EventFriendListSynced',
  'EventBlackListSynced',
  'EventGroupListSynced',
  'EventGroupMemberSynced',
  'EventConversationSynced',
  'EventMsgSent',
  'EventMsgRevoked',
  'EventGroupMemberInvited',
  'EventConversationCreated',
  'EventTokenRefreshFailed',
];

export function eventNameOf(type: number): string {
  return EVENT_NAMES[type] ?? 'EventUnknown';
}

export interface GoimEvent<T = unknown> {
  type: number;
  name: string;
  timestamp: number;
  payload: T;
}

// Go 侧 EventPayload = { type, timestamp, payload? }；
// payload 本身又是具体事件对象的 JSON 字符串，需要二次解析。
export function parseEvent(eventType: string, payloadJSON: string): GoimEvent {
  const name = eventType || 'EventUnknown';
  try {
    const env = JSON.parse(payloadJSON) as {
      type?: number;
      timestamp?: number;
      payload?: string;
    };
    return {
      type: env.type ?? 0,
      name,
      timestamp: env.timestamp ?? Date.now(),
      payload: env.payload ? JSON.parse(env.payload) : undefined,
    };
  } catch {
    return { type: 0, name, timestamp: Date.now(), payload: payloadJSON };
  }
}
