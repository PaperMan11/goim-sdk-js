// IndexedDB 只读访问。
//
// 复用 idb_wrapper.js 暴露的 goimIdb，store 结构与 goim-sdk-core
// pkg/storage/idb_storage.go 一致。写入始终由 Go 侧完成，这里只读。

import type { Conversation, MsgData } from './types';

interface IdbEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

interface IdbMessageRow {
  owner: string;
  conversationID: string;
  seq: number;
  clientMsgID?: string;
  dataJSON: string;
}

interface IdbConversationRow {
  owner: string;
  conversationID: string;
  latestMsgSendTime?: number;
  dataJSON: string;
}

async function idbOp<T>(operation: string, args: unknown): Promise<T> {
  const idb = window.goimIdb;
  if (!idb) {
    throw new Error('goimIdb 未加载：请确认 idb_wrapper.js 在 wasm_exec.js 之前注入');
  }
  const raw = await idb.op(operation, JSON.stringify(args));
  const env = JSON.parse(raw) as IdbEnvelope<T>;
  if (!env.ok) {
    throw new Error(`IndexedDB ${operation} 失败: ${env.error ?? 'unknown'}`);
  }
  return env.data as T;
}

export async function listLocalConversations(owner: string): Promise<Conversation[]> {
  const rows = await idbOp<IdbConversationRow[] | null>('listConversations', { owner });
  if (!rows) return [];
  return rows
    .map((row) => safeParse<Conversation>(row.dataJSON))
    .filter((c): c is Conversation => !!c);
}

export async function listLocalMessages(
  owner: string,
  conversationID: string,
): Promise<MsgData[]> {
  const rows = await idbOp<IdbMessageRow[] | null>('listMsgsByConversation', {
    owner,
    conversationID,
  });
  if (!rows) return [];
  return rows
    .map((row) => safeParse<MsgData>(row.dataJSON))
    .filter((m): m is MsgData => !!m)
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

function safeParse<T>(json: string): T | undefined {
  if (!json) return undefined;
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}
