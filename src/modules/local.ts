// 本地数据门面（LocalDataMgr）：只读本地缓存，不发网络请求
// 对齐 goim-sdk-core Client.Local() / Local.* 反射方法；owner 由 core 按当前登录用户解析。

import type {
  BlackInfo,
  BlackPage,
  Conversation,
  ConversationPage,
  ConversationSeqs,
  FriendInfo,
  FriendPage,
  GroupInfo,
  GroupMemberFullInfo,
  GroupMemberPage,
  GroupPage,
  LocalDataStats,
  MsgData,
  MsgPage,
} from '../types';
import { ModuleBase } from './base';

interface RawPage<T> {
  items?: T[] | null;
  total?: number;
  hasMore?: boolean;
}

function normalizePage<T>(page?: RawPage<T> | null): {
  items: T[];
  total: number;
  hasMore: boolean;
} {
  return {
    items: page?.items ?? [],
    total: page?.total ?? 0,
    hasMore: page?.hasMore ?? false,
  };
}

function normalizeMsgPage(page?: MsgPage | null): MsgPage {
  return {
    items: page?.items ?? [],
    oldestSeq: page?.oldestSeq ?? 0,
    newestSeq: page?.newestSeq ?? 0,
    hasMore: page?.hasMore ?? false,
  };
}

export class LocalModule extends ModuleBase {
  // ———— 会话 ————

  // 本地会话列表：置顶优先 + latestMsgSendTime 倒序，offset/limit 分页（limit 默认 50，上限 200）
  async listConversations(offset = 0, limit = 50): Promise<ConversationPage> {
    const page = await this.goim.call<RawPage<Conversation> | null>(
      'Local.ListConversations',
      [offset, limit],
    );
    return normalizePage(page);
  }

  // 单会话直读；不存在返回 undefined（与服务端最新态用 conversations.get 区分）
  async getConversation(conversationID: string): Promise<Conversation | undefined> {
    const conv = await this.goim.call<Conversation | null>('Local.GetConversation', [
      conversationID,
    ]);
    return conv ?? undefined;
  }

  // 批量直读，顺序与入参一致，不存在的跳过
  async getConversations(conversationIDs: string[]): Promise<Conversation[]> {
    const list = await this.goim.call<Conversation[] | null>('Local.GetConversations', [
      conversationIDs,
    ]);
    return list ?? [];
  }

  // 本地/服务端 seq 边界快照
  getConversationSeqs(conversationID: string): Promise<ConversationSeqs> {
    return this.goim.call('Local.GetConversationSeqs', [conversationID]);
  }

  // 本地推导未读（离线可用；不含 n_ 通知会话的判断由 core 处理）
  unreadCount(conversationID: string): Promise<number> {
    return this.goim.call('Local.UnreadCount', [conversationID]);
  }

  unreadTotal(): Promise<number> {
    return this.goim.call('Local.UnreadTotal', []);
  }

  // ———— 消息 ————

  // 本地降序分页：beforeSeq<=0 取最新，继续向更早翻页传 page.oldestSeq - 1
  async listMsgs(
    conversationID: string,
    beforeSeq = 0,
    limit = 30,
  ): Promise<MsgPage> {
    const page = await this.goim.call<MsgPage | null>('Local.ListMsgs', [
      conversationID,
      beforeSeq,
      limit,
    ]);
    return normalizeMsgPage(page);
  }

  // 本地升序分页：afterSeq<=0 从头，否则取 > afterSeq（补断档用）
  async listMsgsAfter(
    conversationID: string,
    afterSeq = 0,
    limit = 30,
  ): Promise<MsgPage> {
    const page = await this.goim.call<MsgPage | null>('Local.ListMsgsAfter', [
      conversationID,
      afterSeq,
      limit,
    ]);
    return normalizeMsgPage(page);
  }

  async getMsg(conversationID: string, seq: number): Promise<MsgData | undefined> {
    const msg = await this.goim.call<MsgData | null>('Local.GetMsg', [
      conversationID,
      seq,
    ]);
    return msg ?? undefined;
  }

  // 按客户端消息 ID 直读（重发去重、回执匹配）
  async getMsgByClientID(
    conversationID: string,
    clientMsgID: string,
  ): Promise<MsgData | undefined> {
    const msg = await this.goim.call<MsgData | null>('Local.GetMsgByClientID', [
      conversationID,
      clientMsgID,
    ]);
    return msg ?? undefined;
  }

  // ———— 好友 / 黑名单 ————

  // 置顶优先 + 昵称排序
  async listFriends(offset = 0, limit = 50): Promise<FriendPage> {
    const page = await this.goim.call<RawPage<FriendInfo> | null>(
      'Local.ListFriends',
      [offset, limit],
    );
    return normalizePage(page);
  }

  async getFriend(userID: string): Promise<FriendInfo | undefined> {
    const friend = await this.goim.call<FriendInfo | null>('Local.GetFriend', [userID]);
    return friend ?? undefined;
  }

  async listBlacks(offset = 0, limit = 50): Promise<BlackPage> {
    const page = await this.goim.call<RawPage<BlackInfo> | null>('Local.ListBlacks', [
      offset,
      limit,
    ]);
    return normalizePage(page);
  }

  isBlocked(userID: string): Promise<boolean> {
    return this.goim.call('Local.IsBlocked', [userID]);
  }

  // ———— 搜索（大小写不敏感子串匹配）————

  // 匹配会话 ID / 对方昵称 / 群名 / 摘要文本
  async searchConversations(keyword: string, limit = 50): Promise<ConversationPage> {
    const page = await this.goim.call<RawPage<Conversation> | null>(
      'Local.SearchConversations',
      [keyword, limit],
    );
    return normalizePage(page);
  }

  // 单会话内搜索消息（按 seq 倒序）
  async searchMsgs(
    conversationID: string,
    keyword: string,
    limit = 30,
  ): Promise<MsgPage> {
    const page = await this.goim.call<MsgPage | null>('Local.SearchMsgs', [
      conversationID,
      keyword,
      limit,
    ]);
    return normalizeMsgPage(page);
  }

  // 匹配 userID / 昵称 / 备注
  async searchFriends(keyword: string, limit = 50): Promise<FriendPage> {
    const page = await this.goim.call<RawPage<FriendInfo> | null>(
      'Local.SearchFriends',
      [keyword, limit],
    );
    return normalizePage(page);
  }

  // 匹配 groupID / 群名
  async searchGroups(keyword: string, limit = 50): Promise<GroupPage> {
    const page = await this.goim.call<RawPage<GroupInfo> | null>(
      'Local.SearchGroups',
      [keyword, limit],
    );
    return normalizePage(page);
  }

  // ———— 统计 ————

  // 本地缓存条数（会话/消息/好友/黑名单/群/群成员）
  stats(): Promise<LocalDataStats> {
    return this.goim.call('Local.Stats', []);
  }

  // ———— 群 / 群成员 ————

  async listGroups(offset = 0, limit = 50): Promise<GroupPage> {
    const page = await this.goim.call<RawPage<GroupInfo> | null>('Local.ListGroups', [
      offset,
      limit,
    ]);
    return normalizePage(page);
  }

  async getGroup(groupID: string): Promise<GroupInfo | undefined> {
    const group = await this.goim.call<GroupInfo | null>('Local.GetGroup', [groupID]);
    return group ?? undefined;
  }

  // 角色优先 + 入群时间升序
  async listGroupMembers(
    groupID: string,
    offset = 0,
    limit = 50,
  ): Promise<GroupMemberPage> {
    const page = await this.goim.call<RawPage<GroupMemberFullInfo> | null>(
      'Local.ListGroupMembers',
      [groupID, offset, limit],
    );
    return normalizePage(page);
  }

  async getGroupMember(
    groupID: string,
    userID: string,
  ): Promise<GroupMemberFullInfo | undefined> {
    const member = await this.goim.call<GroupMemberFullInfo | null>(
      'Local.GetGroupMember',
      [groupID, userID],
    );
    return member ?? undefined;
  }

  // ———— 本地清理（仅本机，不影响服务端）————

  // 删除本地 seq <= upToSeq 的消息并落 floor（只增不减），返回删除条数。
  // floor 用于阻止自动同步把已清理的历史重新拉回；显式历史请求不受限。
  purgeMsgs(conversationID: string, upToSeq: number): Promise<number> {
    return this.goim.call('Local.PurgeMsgs', [conversationID, upToSeq]);
  }

  // 清空当前账号全部本地缓存：逐会话写 floor → 清消息 → 清实体表；
  // 保留 seqs/versions 同步游标、SDK meta 与登录态（不登出）。
  clearLocalData(): Promise<void> {
    return this.goim.call('Local.ClearLocalData', []);
  }
}
