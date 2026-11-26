import { listLocalMessages } from '../idb';
import { buildTextContent } from '../protocol/content';
import {
  ContentType,
  MsgFrom,
  MsgOptionPreset,
  SessionType,
  type HistoryMsgsPage,
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

  // 服务端分页历史（降序，最新在前），结果会写入本地缓存。
  // 第 1 页传 beforeSeq<=0；继续向更早翻页传上一页 oldestSeq - 1（服务端区间为闭区间）
  getHistoryMsgs(
    conversationID: string,
    beforeSeq = 0,
    count = 20,
  ): Promise<HistoryMsgsPage> {
    return this.goim.call('GetHistoryMsgs', [conversationID, beforeSeq, count]);
  }

  // 服务端增量消息（升序），补齐比本地更新的消息，结果会写入本地缓存
  getNewerMsgs(
    conversationID: string,
    afterSeq = 0,
    count = 20,
  ): Promise<HistoryMsgsPage> {
    return this.goim.call('GetNewerMsgs', [conversationID, afterSeq, count]);
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

  // 删除消息：默认仅自己不可见（IsSyncSelf=true / IsSyncOther=false）。
  // 服务端会对本人 del_list 追加 userID，并给自己发 2102 通知；
  // IsSyncOther=true 为「对所有人删除」（群管理员能力）。
  delete(
    conversationID: string,
    seqs: number[],
    opt: { isSyncSelf?: boolean; isSyncOther?: boolean } = {},
  ): Promise<void> {
    return this.goim.call('MsgMgr.DeleteMsgs', [
      conversationID,
      seqs,
      {
        IsSyncSelf: opt.isSyncSelf ?? true,
        IsSyncOther: opt.isSyncOther ?? false,
      },
    ]);
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
      // 协议要求 content 为 JSON 字符串：{"text":"...","atUsers":[]}
      content: buildTextContent(text),
      options: { ...MsgOptionPreset.Normal },
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
