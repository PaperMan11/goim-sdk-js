// 与 goim-sdk-core pkg/model 对齐的 DTO 定义（JSON 字段名保持一致）

export const SessionType = {
  C2C: 1,
  Group: 3,
} as const;

export const ContentType = {
  Text: 101,
  Image: 102,
} as const;

export const MsgFrom = {
  User: 100,
  System: 200,
} as const;

export const MsgStatus = {
  Success: 1,
  Sending: 2,
  Failed: 3,
  Revoked: 4,
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

export type TransportStatusValue =
  (typeof TransportStatus)[keyof typeof TransportStatus];
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

