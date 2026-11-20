// 会话 ID 规则（对齐 goim pkg/msgprocessor/conversation.go）
//
// si_<小ID>_<大ID>  单聊（ID 排序拼接）
// g_<groupID>       写扩散群聊
// sg_<groupID>      读扩散群聊（超级群）
// n_<sendID>_<recvID> / n_<groupID>  通知类判断用会话
// sn_<小ID>_<大ID>  通知会话（NotificationChatType 落库用）

export const ConversationPrefix = {
  C2C: 'si_',
  Group: 'g_',
  SuperGroup: 'sg_',
  Notification: 'n_',
  NotificationChat: 'sn_',
} as const;

export type ConversationKind =
  | 'c2c'
  | 'group'
  | 'superGroup'
  | 'notification'
  | 'notificationChat'
  | 'unknown';

function sortedPair(id1: string, id2: string): string {
  return id1 <= id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
}

export function buildC2CConversationID(userID1: string, userID2: string): string {
  return ConversationPrefix.C2C + sortedPair(userID1, userID2);
}

export function buildNotificationConversationID(
  userID1: string,
  userID2: string,
): string {
  return ConversationPrefix.Notification + sortedPair(userID1, userID2);
}

export function buildNotificationChatConversationID(
  userID1: string,
  userID2: string,
): string {
  return ConversationPrefix.NotificationChat + sortedPair(userID1, userID2);
}

// 群会话：readDiffusion=true 生成 sg_（超级群），否则 g_
export function buildGroupConversationID(
  groupID: string,
  readDiffusion = false,
): string {
  const prefix = readDiffusion
    ? ConversationPrefix.SuperGroup
    : ConversationPrefix.Group;
  return prefix + groupID;
}

export function buildGroupNotificationConversationID(groupID: string): string {
  return ConversationPrefix.Notification + groupID;
}

export function conversationKind(conversationID: string): ConversationKind {
  if (conversationID.startsWith(ConversationPrefix.SuperGroup)) return 'superGroup';
  if (conversationID.startsWith(ConversationPrefix.C2C)) return 'c2c';
  if (conversationID.startsWith(ConversationPrefix.Group)) return 'group';
  if (conversationID.startsWith(ConversationPrefix.NotificationChat)) {
    return 'notificationChat';
  }
  if (conversationID.startsWith(ConversationPrefix.Notification)) {
    return 'notification';
  }
  return 'unknown';
}

export function isNotificationConversation(conversationID: string): boolean {
  return conversationID.startsWith(ConversationPrefix.Notification);
}

export function isGroupConversation(conversationID: string): boolean {
  return (
    conversationID.startsWith(ConversationPrefix.Group) ||
    conversationID.startsWith(ConversationPrefix.SuperGroup)
  );
}

// 解析会话 ID 中的业务 ID：si_/sn_ 返回排序后的两个用户 ID；g_/sg_/n_(群) 返回 groupID
export function parseConversationID(conversationID: string): {
  kind: ConversationKind;
  userIDs?: [string, string];
  groupID?: string;
} {
  const kind = conversationKind(conversationID);
  const body = conversationID.replace(/^(si_|sg_|g_|sn_|n_)/, '');
  switch (kind) {
    case 'c2c':
    case 'notificationChat': {
      const [a, b] = body.split('_');
      return b ? { kind, userIDs: [a, b] } : { kind };
    }
    case 'group':
    case 'superGroup':
      return { kind, groupID: body };
    case 'notification': {
      // n_ 既可能是 <sendID>_<recvID>（单聊通知），也可能是 <groupID>（群通知）
      const parts = body.split('_');
      if (parts.length === 2) {
        return { kind, userIDs: [parts[0], parts[1]] };
      }
      return { kind, groupID: body };
    }
    default:
      return { kind };
  }
}
