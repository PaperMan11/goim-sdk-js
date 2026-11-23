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
}
