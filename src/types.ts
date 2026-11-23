// 与 goim-sdk-core pkg/model 对齐的 DTO 定义（JSON 字段名保持一致）

export const SessionType = {
  C2C: 1,
  WriteGroup: 2,
  ReadGroup: 3,
  Group: 3, // 群聊（读扩散），兼容旧命名
  Notification: 4,
} as const;

// 内容类型（对齐 goim pkg/protocol/constant/content_type.go）
export const ContentType = {
  Text: 101,
  Picture: 102,
  Image: 102, // 兼容旧命名
  Voice: 103,
  Video: 104,
  File: 105,
  AtText: 106,
  Merger: 107,
  Card: 108,
  Location: 109,
  Custom: 110,
  Revoke: 111,
  Typing: 113,
  Quote: 114,
  AdvancedText: 117,
  MarkdownText: 118,
  CustomNotTriggerConversation: 119,
  CustomOnlineOnly: 120,
  ReactionMessageModifier: 121,
  ReactionMessageDeleter: 122,
  Common: 200,
  GroupMsg: 201,
  SignalMsg: 202,
  CustomNotification: 203,

  FriendApplicationApprovedNotification: 1201,
  FriendApplicationRejectedNotification: 1202,
  FriendApplicationNotification: 1203,
  FriendAddedNotification: 1204,
  FriendDeletedNotification: 1205,
  FriendRemarkSetNotification: 1206,
  BlackAddedNotification: 1207,
  BlackDeletedNotification: 1208,
  FriendInfoUpdatedNotification: 1209,
  FriendsInfoUpdateNotification: 1210,
  ConversationChangeNotification: 1300,
  UserInfoUpdatedNotification: 1303,
  UserStatusChangeNotification: 1304,
  UserCommandAddNotification: 1305,
  UserCommandDeleteNotification: 1306,
  UserCommandUpdateNotification: 1307,
  UserSubscribeOnlineStatusNotification: 1308,
  OANotification: 1400,
  GroupCreatedNotification: 1501,
  GroupInfoSetNotification: 1502,
  JoinGroupApplicationNotification: 1503,
  MemberQuitNotification: 1504,
  GroupApplicationAcceptedNotification: 1505,
  GroupApplicationRejectedNotification: 1506,
  GroupOwnerTransferredNotification: 1507,
  MemberKickedNotification: 1508,
  MemberInvitedNotification: 1509,
  MemberEnterNotification: 1510,
  GroupDismissedNotification: 1511,
  GroupMemberMutedNotification: 1512,
  GroupMemberCancelMutedNotification: 1513,
  GroupMutedNotification: 1514,
  GroupCancelMutedNotification: 1515,
  GroupMemberInfoSetNotification: 1516,
  GroupMemberSetToAdminNotification: 1517,
  GroupMemberSetToOrdinaryUserNotification: 1518,
  GroupInfoSetAnnouncementNotification: 1519,
  GroupInfoSetNameNotification: 1520,
  SuperGroupUpdateNotification: 1651,
  MsgDeleteNotification: 1652,
  ConversationPrivateChatNotification: 1701,
  ConversationUnreadNotification: 1702,
  ClearConversationNotification: 1703,
  ConversationDeleteNotification: 1704,
  BusinessNotification: 2001,
  MsgRevokeNotification: 2101,
  DeleteMsgsNotification: 2102,
  HasReadReceipt: 2200,
} as const;

export const MsgFrom = {
  User: 100,
  System: 200,
} as const;

// 消息状态（对齐 goim docs/protocol-message.md §1：
// 1 发送中 / 2 发送成功 / 3 发送失败 / 4 已删除 / 5 已过滤）
export const MsgStatus = {
  NotExist: 0,
  Sending: 1,
  SendSuccess: 2,
  SendFailed: 3,
  HasDeleted: 4,
  Filtered: 5,
} as const;

// 发送者平台 ID（对齐 constant.PlatformID*）
export const PlatformID = {
  IOS: 1,
  Android: 2,
  Windows: 3,
  OSX: 4,
  Web: 5,
  MiniWeb: 6,
  Linux: 7,
  APad: 8,
  IPad: 9,
  Admin: 10,
  HarmonyOS: 11,
  Bot: 12,
} as const;

// 消息选项键（对齐 constant.Is*）
export const MsgOption = {
  History: 'history',
  Persistent: 'persistent',
  OfflinePush: 'offlinePush',
  UnreadCount: 'unreadCount',
  ConversationUpdate: 'conversationUpdate',
  SenderSync: 'senderSync',
  NotPrivate: 'notPrivate',
  SenderConversationUpdate: 'senderConversationUpdate',
  SenderNotificationPush: 'senderNotificationPush',
  ReactionFromCache: 'reactionFromCache',
  IsNotNotification: 'isNotNotification',
  IsSendMsg: 'isSendMsg',
} as const;

// 常用 options 组合（对应 protocol-message.md §5 的典型组合）
export const MsgOptionPreset = {
  // 普通聊天消息
  Normal: {
    history: true,
    persistent: true,
    offlinePush: true,
    unreadCount: true,
    conversationUpdate: true,
    senderSync: true,
    isSendMsg: true,
  },
  // 正在输入：不落库、不计未读、不更新会话
  Typing: {
    history: false,
    persistent: false,
    offlinePush: false,
    unreadCount: false,
    conversationUpdate: false,
    senderSync: false,
    isNotNotification: true,
    isSendMsg: false,
  },
  // 撤回消息
  Revoke: {
    history: false,
    persistent: true,
    offlinePush: false,
    unreadCount: false,
    conversationUpdate: true,
    senderSync: true,
    isSendMsg: false,
  },
  // 仅在线自定义消息
  OnlineOnly: {
    history: false,
    persistent: false,
    offlinePush: false,
    unreadCount: false,
    conversationUpdate: false,
    senderSync: false,
    isSendMsg: true,
  },
  // 系统通知（不落未读）
  SystemNotification: {
    history: true,
    persistent: true,
    offlinePush: true,
    unreadCount: false,
    conversationUpdate: true,
    notPrivate: true,
    isSendMsg: true,
  },
} as const;

// 群类型 / 群状态 / 加群验证 / 全局消息接收 / @类型
export const GroupType = {
  Normal: 0,
  Super: 1,
  Work: 2,
} as const;

export const GroupStatus = {
  Normal: 0,
  Muted: 1,
  Dismissed: 2,
  MutedAll: 3,
  NoPrivateChat: 4,
} as const;

export const NeedVerification = {
  ApplyNeedVerifyInviteDirect: 0,
  AllNeedVerify: 1,
  DirectJoin: 2,
} as const;

export const GlobalRecvMsgOpt = {
  Receive: 0,
  NotReceive: 1,
  ReceiveNotNotify: 2,
} as const;

export const AtType = {
  Normal: 0,
  AtMe: 1,
  AtAll: 2,
  AtAllAtMe: 3,
  GroupNotification: 4,
} as const;

// @所有人标记（MsgData.atUserIDList / atUsers.atUserID 中使用）
export const AtAllTag = 'AtAllTag';

// 通知可靠性级别
export const NotificationReliability = {
  Unreliable: 1,
  ReliableNoMsg: 2,
  ReliableMsg: 3,
} as const;

export const TransportStatus = {
  Disconnected: 0,
  Connecting: 1,
  Connected: 2,
} as const;

export const SyncState = {
  None: 0,
  Syncing: 1,
  Synced: 2,
  Failed: 3,
} as const;

export type TransportStatusValue = (typeof TransportStatus)[keyof typeof TransportStatus];
export type SyncStateValue = (typeof SyncState)[keyof typeof SyncState];

export interface OfflinePushInfo {
  title?: string;
  desc?: string;
  ex?: string;
  iOSPushSound?: string;
  iOSBadgeCount?: boolean;
}

export interface MsgData {
  sendID?: string;
  recvID?: string;
  groupID?: string;
  clientMsgID?: string;
  serverMsgID?: string;
  senderPlatformID?: number;
  senderNickname?: string;
  senderFaceURL?: string;
  sessionType?: number;
  msgFrom?: number;
  contentType?: number;
  content?: string;
  seq?: number;
  sendTime?: number;
  createTime?: number;
  status?: number;
  isRead?: boolean;
  conversationID?: string;
  options?: Record<string, boolean>;
  offlinePushInfo?: OfflinePushInfo;
  atUserIDList?: string[];
  attachedInfo?: string;
  ex?: string;
}

export interface SendMsgResp {
  clientMsgID: string;
  serverMsgID: string;
  sendTime: number;
  modifyTime: number;
}

// 服务端分页历史结果（GetHistoryMsgs / GetNewerMsgs）
export interface HistoryMsgsPage {
  msgs: MsgData[];
  // 服务端标记的区间末尾
  isEnd: boolean;
  // 本页实际最小 / 最大 seq；向更早翻页时下一次 beforeSeq 传 oldestSeq - 1
  oldestSeq: number;
  newestSeq: number;
}

export interface SeqRange {
  conversationID: string;
  begin: number;
  end: number;
  num: number;
  order: number; // 0 升序 / 1 降序
}

export interface PullMsgsResult {
  msgs: MsgData[];
  isEnd: boolean;
  endSeq: string;
}

export interface MsgInfo {
  serverMsgID?: string;
  clientMsgID?: string;
  sessionType?: number;
  sendID?: string;
  recvID?: string;
  senderName?: string;
  faceURL?: string;
  groupID?: string;
  groupName?: string;
  groupFaceURL?: string;
  latestMsgRecvTime?: number;
  msgFrom?: number;
  contentType?: number;
  content?: string;
  ex?: string;
}

export interface Conversation {
  ownerUserID?: string;
  conversationID?: string;
  recvMsgOpt?: number;
  conversationType?: number;
  userID?: string;
  groupID?: string;
  isPinned?: boolean;
  minSeq?: number;
  maxSeq?: number;
  unreadCount?: number;
  latestMsgSendTime?: number;
  draftText?: string;
  msgInfo?: MsgInfo;
  ex?: string;
}

export interface UserInfo {
  userID?: string;
  nickname?: string;
  faceURL?: string;
  ex?: string;
  createTime?: number;
  appMangerLevel?: number;
  globalRecvMsgOpt?: number;
}

export interface GroupInfo {
  groupID?: string;
  groupName?: string;
  notification?: string;
  introduction?: string;
  faceURL?: string;
  ownerUserID?: string;
  createTime?: number;
  memberCount?: number;
  ex?: string;
  status?: number;
  creatorUserID?: string;
  groupType?: number;
  needVerification?: number;
  lookMemberInfo?: number;
  applyMemberFriend?: number;
  notificationUpdateTime?: number;
  notificationUserID?: string;
}

export interface GroupMemberFullInfo {
  groupID?: string;
  userID?: string;
  roleLevel?: number;
  joinTime?: number;
  nickname?: string;
  faceURL?: string;
  appMangerLevel?: number;
  joinSource?: number;
  operatorUserID?: string;
  ex?: string;
  muteEndTime?: number;
  inviterUserID?: string;
}

// wrapperspb 兼容：服务端可选字段形如 {"value": ...}
export interface StringValue {
  value: string;
}

export interface Int32Value {
  value: number;
}

// 设置群资料（名称类字段为裸值，可选行为字段用 wrapperspb 形态）
export interface GroupInfoForSet {
  groupID: string;
  groupName?: string;
  notification?: string;
  introduction?: string;
  faceURL?: string;
  ex?: StringValue;
  needVerification?: Int32Value;
  lookMemberInfo?: Int32Value;
  applyMemberFriend?: Int32Value;
}

// 设置群资料扩展（字段全为 wrapperspb 形态，groupID 单独传）
export interface GroupInfoExOptions {
  groupName?: StringValue;
  notification?: StringValue;
  introduction?: StringValue;
  faceURL?: StringValue;
  ex?: StringValue;
  needVerification?: Int32Value;
  lookMemberInfo?: Int32Value;
  applyMemberFriend?: Int32Value;
}

export interface SetGroupMemberInfo {
  groupID: string;
  userID: string;
  nickname?: StringValue;
  faceURL?: StringValue;
  roleLevel?: Int32Value;
  ex?: StringValue;
}

export interface RequestPagination {
  pageNumber: number;
  showNumber: number;
}

export interface GroupAbstractInfo {
  groupID?: string;
  groupMemberNumber?: number;
  groupMemberListHash?: number;
}

// 群成员角色（对齐 core RoleMember / RoleAdmin / RoleOwner）
export const GroupRoleLevel = {
  Member: 20,
  Admin: 60,
  Owner: 100,
} as const;

// 入群来源（对齐 core JoinByAdmin / JoinByInvitation / JoinBySearch / JoinByQRCode）
export const GroupJoinSource = {
  Admin: 1,
  Invitation: 2,
  Search: 3,
  QRCode: 4,
} as const;

// 入群申请处理结果（对齐 core GroupResponseAgree / GroupResponseRefuse）
export const GroupApplicationResult = {
  Approve: 1,
  Reject: -1,
} as const;

// ———— 本地数据（LocalDataMgr）相关结构，对齐 goim-sdk-core pkg/model/local.go ————

export interface PublicUserInfo {
  userID?: string;
  nickname?: string;
  faceURL?: string;
  ex?: string;
}

export interface FriendInfo {
  ownerUserID?: string;
  remark?: string;
  createTime?: number;
  friendUser?: UserInfo;
  addSource?: number;
  operatorUserID?: string;
  ex?: string;
  isPinned?: boolean;
}

export interface BlackInfo {
  ownerUserID?: string;
  createTime?: number;
  blackUserInfo?: PublicUserInfo;
  addSource?: number;
  operatorUserID?: string;
  ex?: string;
}

export interface ConversationPage {
  items: Conversation[];
  total: number;
  hasMore: boolean;
}

export interface FriendPage {
  items: FriendInfo[];
  total: number;
  hasMore: boolean;
}

export interface BlackPage {
  items: BlackInfo[];
  total: number;
  hasMore: boolean;
}

export interface GroupPage {
  items: GroupInfo[];
  total: number;
  hasMore: boolean;
}

export interface GroupMemberPage {
  items: GroupMemberFullInfo[];
  total: number;
  hasMore: boolean;
}

// 本地消息分页（seq 游标，无 total）
export interface MsgPage {
  items: MsgData[];
  oldestSeq: number;
  newestSeq: number;
  hasMore: boolean;
}

// 单会话本地/服务端 seq 边界快照
export interface ConversationSeqs {
  conversationID?: string;
  localMinSeq?: number;
  localMaxSeq?: number;
  hasReadSeq?: number;
  serverMinSeq?: number;
  serverMaxSeq?: number;
}

// 本地缓存条数统计
export interface LocalDataStats {
  conversations: number;
  messages: number;
  friends: number;
  blacks: number;
  groups: number;
  groupMembers: number;
}

