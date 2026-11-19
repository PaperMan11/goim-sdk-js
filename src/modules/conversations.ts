import { listLocalConversations } from '../idb';
import type { Conversation } from '../types';
import { ModuleBase } from './base';

export class ConversationsModule extends ModuleBase {
  // 本地 IndexedDB 会话缓存（需先等待 EventSyncFinish）
  listLocal(ownerUserID = this.goim.requireUserID()): Promise<Conversation[]> {
    return listLocalConversations(ownerUserID);
  }

  // HTTP 全量会话（服务端权威数据，本地为空时兜底）
  async getAll(ownerUserID = this.goim.requireUserID()): Promise<Conversation[]> {
    const list = await this.goim.call<Conversation[] | null>(
      'ConvMgr.GetAllConversations',
      [ownerUserID],
    );
    return list ?? [];
  }

  get(
    conversationID: string,
    ownerUserID = this.goim.requireUserID(),
  ): Promise<Conversation> {
    return this.goim.call('ConvMgr.GetConversation', [ownerUserID, conversationID]);
  }

  // ———— 本地未读（离线可用，不发网络请求）————

  // 单会话未读数：以缓存中已读消息的最大 seq 推导，缓存为空时回落会话 unreadCount
  unreadCount(conversationID: string): Promise<number> {
    return this.goim.call('UnreadCount', [conversationID]);
  }

  // 全部业务会话未读总和（不含 n_ 通知会话）
  unreadTotal(): Promise<number> {
    return this.goim.call('UnreadTotal', []);
  }
}
