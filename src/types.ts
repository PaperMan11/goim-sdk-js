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
  faceURL?: string;
  memberCount?: number;
  status?: number;
  groupType?: number;
  ex?: string;
}
