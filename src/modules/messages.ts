import { listLocalMessages } from '../idb';
import {
  ContentType,
  MsgFrom,
  SessionType,
  type MsgData,
  type PullMsgsResult,
  type SendMsgResp,
  type SeqRange,
} from '../types';
import { ModuleBase } from './base';

// 发送目标：单聊填 userID，群聊填 groupID
export interface SendTarget {
  sessionType: number;
  userID?: string;
  groupID?: string;
}

export class MessagesModule extends ModuleBase {
  // 发送文本消息（contentType=101）
  // opts.clientMsgID 由调用方预生成时，可与本地乐观消息按同一 ID 合并
  async sendText(
    target: SendTarget,
    text: string,
    opts: { clientMsgID?: string } = {},
  ): Promise<SendMsgResp> {
    const msg = this.buildTextMsg(target, text, opts.clientMsgID);
    return this.goim.call<SendMsgResp>('MsgMgr.SendMsg', [msg]);
  }

  // 发送现成 MsgData（图片/自定义消息等场景自行补齐 contentType/content）
  send(msg: MsgData): Promise<SendMsgResp> {
    return this.goim.call('MsgMgr.SendMsg', [msg]);
  }

  // 本地消息缓存（需先等待 EventSyncFinish）
  historyLocal(
    conversationID: string,
    ownerUserID = this.goim.requireUserID(),
  ): Promise<MsgData[]> {
    return listLocalMessages(ownerUserID, conversationID);
  }

  // 服务端按 seq 拉取；order: 0 升序 / 1 降序
  async pullBySeq(
    conversationID: string,
    begin: number,
    end: number,
    num = 20,
    order = 0,
    userID = this.goim.requireUserID(),
  ): Promise<MsgData[]> {
    const ranges: SeqRange[] = [{ conversationID, begin, end, num, order }];
    const result = await this.goim.call<Record<string, PullMsgsResult> | null>(
      'MsgMgr.PullMsgBySeq',
      [userID, ranges, order],
    );
    return result?.[conversationID]?.msgs ?? [];
  }

  markRead(conversationID: string, hasReadSeq: number, seqs: number[] = []): Promise<void> {
    return this.goim.call('MsgMgr.MarkConversationAsRead', [
      conversationID,
      hasReadSeq,
      seqs,
    ]);
  }

  revoke(conversationID: string, seq: number): Promise<void> {
    return this.goim.call('MsgMgr.RevokeMsg', [conversationID, seq]);
  }

  private buildTextMsg(
    target: SendTarget,
    text: string,
    clientMsgID?: string,
  ): MsgData {
    const now = Date.now();
    const msg: MsgData = {
      clientMsgID: clientMsgID ?? newClientMsgID(),
      sendID: this.goim.requireUserID(),
      senderPlatformID: this.goim.platformID,
      sessionType: target.sessionType,
      msgFrom: MsgFrom.User,
      contentType: ContentType.Text,
      content: text,
      createTime: now,
      sendTime: now,
    };
    if (target.sessionType === SessionType.Group) {
      if (!target.groupID) throw new Error('群聊消息必须提供 groupID');
      msg.groupID = target.groupID;
      msg.recvID = target.groupID;
    } else {
      if (!target.userID) throw new Error('单聊消息必须提供 userID');
      msg.recvID = target.userID;
    }
    return msg;
  }
}

function newClientMsgID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
