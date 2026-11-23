// 通知消息（contentType >= 1000）content 协议（对齐 goim docs/protocol-message.md §4）
//
// 通知 content 是 NotificationElem 的 JSON：{"detail":"<Tips JSON 字符串>"}，
// detail 为二次编码的字符串。解析时先解外层拿 detail，再 JSON.parse(detail) 得到 Tips。

import type {
  FriendInfo,
  GroupInfo,
  GroupMemberFullInfo,
  MsgData,
  PublicUserInfo,
} from '../types';
import { tryParseJSON } from './content';

export interface NotificationElem {
  detail?: string; // Tips 结构序列化后的 JSON 字符串
}

// ———— 公共子结构 ————

export interface FromToUserID {
  fromUserID?: string;
  toUserID?: string;
}

export interface FriendRequest {
  fromUserID?: string;
  fromNickname?: string;
  fromFaceURL?: string;
  toUserID?: string;
  toNickname?: string;
  toFaceURL?: string;
  handleResult?: number;
  reqMsg?: string;
  createTime?: number;
  handlerUserID?: string;
  handleMsg?: string;
  handleTime?: number;
  ex?: string;
}

export interface GroupRequest {
  userInfo?: PublicUserInfo;
  groupInfo?: GroupInfo;
  handleResult?: number;
  reqMsg?: string;
  handleMsg?: string;
  reqTime?: number;
  handleUserID?: string;
  handleTime?: number;
  ex?: string;
  joinSource?: number;
  inviterUserID?: string;
}

// ———— 好友通知（1201-1210）————

export interface FriendApplicationTips {
  fromToUserID?: FromToUserID;
  request?: FriendRequest;
}

export interface FriendApplicationApprovedTips extends FriendApplicationTips {
  handleMsg?: string;
  friendVersion?: number;
  friendVersionID?: string;
}

export interface FriendApplicationRejectedTips {
  fromToUserID?: FromToUserID;
  handleMsg?: string;
  request?: FriendRequest;
}

export interface FriendAddedTips {
  friend?: FriendInfo;
  operationTime?: number;
  opUser?: PublicUserInfo;
  friendVersion?: number;
  friendVersionID?: string;
}

export interface FriendDeletedTips {
  fromToUserID?: FromToUserID;
  friendVersion?: number;
  friendVersionID?: string;
}

export interface FriendInfoChangedTips {
  fromToUserID?: FromToUserID;
  friendVersion?: number;
  friendVersionID?: string;
  friendSortVersion?: number;
}

export interface BlackAddedTips {
  fromToUserID?: FromToUserID;
}

export type BlackDeletedTips = BlackAddedTips;

export interface FriendsInfoUpdateTips {
  fromToUserID?: FromToUserID;
  friendIDs?: string[];
  friendVersion?: number;
  friendVersionID?: string;
}

// ———— 会话通知（1300 / 1701-1704）————

export interface ConversationUpdateTips {
  userID?: string;
  conversationIDList?: string[];
}

export interface ConversationSetPrivateTips {
  recvID?: string;
  sendID?: string;
  isPrivate?: boolean;
  conversationID?: string;
}

export interface ClearConversationTips {
  userID?: string;
  conversationIDs?: string[];
}

export type ConversationDeleteTips = ClearConversationTips;

// ———— 用户通知（1303-1308）————

export interface UserInfoUpdatedTips {
  userID?: string;
}

export interface UserStatusChangeTips {
  fromUserID?: string;
  toUserID?: string;
  status?: number; // 1 在线 / 0 离线
  platformID?: number;
}

export interface UserCommandTips {
  fromUserID?: string;
  toUserID?: string;
}

export interface SubUserOnlineStatusElem {
  userID?: string;
  onlinePlatformIDs?: number[];
}

export interface SubUserOnlineStatusTips {
  subscribers?: SubUserOnlineStatusElem[];
}

// ———— 群组通知（1501-1520）————

export interface GroupCreatedTips {
  group?: GroupInfo;
  opUser?: GroupMemberFullInfo;
  memberList?: GroupMemberFullInfo[];
  operationTime?: number;
  groupOwnerUser?: GroupMemberFullInfo;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
}

export interface GroupInfoSetTips {
  opUser?: GroupMemberFullInfo;
  muteTime?: number;
  group?: GroupInfo;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
}

export type GroupInfoSetNameTips = Omit<GroupInfoSetTips, 'muteTime'>;
export type GroupInfoSetAnnouncementTips = Omit<GroupInfoSetTips, 'muteTime'>;

export interface JoinGroupApplicationTips {
  group?: GroupInfo;
  applicant?: PublicUserInfo;
  reqMsg?: string;
  uuid?: string;
  request?: GroupRequest;
}

export interface MemberQuitTips {
  group?: GroupInfo;
  quitUser?: GroupMemberFullInfo;
  operationTime?: number;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
}

export interface GroupApplicationAcceptedTips {
  group?: GroupInfo;
  opUser?: GroupMemberFullInfo;
  handleMsg?: string;
  receiverAs?: number; // 1 发给管理员 / 0 发给申请人
  uuid?: string;
  request?: GroupRequest;
}

export type GroupApplicationRejectedTips = GroupApplicationAcceptedTips;

export interface GroupOwnerTransferredTips {
  group?: GroupInfo;
  opUser?: GroupMemberFullInfo;
  newGroupOwner?: GroupMemberFullInfo;
  oldGroupOwner?: string;
  operationTime?: number;
  oldGroupOwnerInfo?: GroupMemberFullInfo;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
}

export interface MemberKickedTips {
  group?: GroupInfo;
  opUser?: GroupMemberFullInfo;
  kickedUserList?: GroupMemberFullInfo[];
  operationTime?: number;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
}

export interface MemberInvitedTips {
  group?: GroupInfo;
  opUser?: GroupMemberFullInfo;
  invitedUserList?: GroupMemberFullInfo[];
  operationTime?: number;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
  inviterUser?: GroupMemberFullInfo;
}

export interface MemberEnterTips {
  group?: GroupInfo;
  entrantUser?: GroupMemberFullInfo;
  operationTime?: number;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
}

export interface GroupDismissedTips {
  group?: GroupInfo;
  opUser?: GroupMemberFullInfo;
  operationTime?: number;
}

export interface GroupMemberMutedTips {
  group?: GroupInfo;
  opUser?: GroupMemberFullInfo;
  operationTime?: number;
  mutedUser?: GroupMemberFullInfo;
  mutedSeconds?: number;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
}

export type GroupMemberCancelMutedTips = Omit<GroupMemberMutedTips, 'mutedSeconds'>;

export interface GroupMutedTips {
  group?: GroupInfo;
  opUser?: GroupMemberFullInfo;
  operationTime?: number;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
}

export type GroupCancelMutedTips = GroupMutedTips;

export interface GroupMemberInfoSetTips {
  group?: GroupInfo;
  opUser?: GroupMemberFullInfo;
  operationTime?: number;
  changedUser?: GroupMemberFullInfo;
  groupMemberVersion?: number;
  groupMemberVersionID?: string;
  groupSortVersion?: number;
}

// ———— 消息类通知（1652 / 2101 / 2102 / 2200）————

export interface DeleteMessageTips {
  opUserID?: string;
  userID?: string;
  seqs?: number[];
}

// 注意 sesstionType 为协议既有拼写（对齐 sdkws.RevokeMsgTips），非笔误
export interface RevokeMsgTips {
  revokerUserID?: string;
  clientMsgID?: string;
  revokeTime?: number;
  sesstionType?: number;
  seq?: number;
  conversationID?: string;
  isAdminRevoke?: boolean;
}

export interface DeleteMsgsTips {
  userID?: string;
  conversationID?: string;
  seqs?: number[];
}

export interface MarkAsReadTips {
  markAsReadUserID?: string;
  conversationID?: string;
  seqs?: number[];
  hasReadSeq?: number;
}

// ———— 解析 ————

export function parseNotificationOuter(
  content?: string,
): NotificationElem | undefined {
  return tryParseJSON<NotificationElem>(content);
}

// 解析通知 content：外层 NotificationElem → detail 二次解析为 Tips
export function parseNotification<T = unknown>(content?: string): T | undefined {
  const outer = parseNotificationOuter(content);
  if (!outer?.detail) return undefined;
  return tryParseJSON<T>(outer.detail);
}

// 直接从 MsgData 解析通知 Tips
export function parseNotificationMsg<T = unknown>(
  msg: Pick<MsgData, 'content'>,
): T | undefined {
  return parseNotification<T>(msg.content);
}

// 构造通知 content（一般由服务端生成，客户端多用于本地模拟/测试）
export function buildNotificationContent(detail: string | object): string {
  const detailText = typeof detail === 'string' ? detail : JSON.stringify(detail);
  return JSON.stringify({ detail: detailText } satisfies NotificationElem);
}
