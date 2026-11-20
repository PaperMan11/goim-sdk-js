// 消息 content 协议结构（对齐 goim/docs/protocol-message.md）
//
// content 在网络与存储中均为 JSON 字符串（MsgData.content），解析时先 JSON.parse 再按
// contentType 取对应结构。图片/语音/文件等结构由客户端自定义，服务端透传不解析；
// 服务端会解析的仅 Quote / AtText / Merger / RevokeNotification（见 core pkg/msgcontent）。

import { AtAllTag, ContentType } from '../types';

// ———— 通用 ————

// @ 用户引用（对齐 core pkg/msgcontent/at.go）：
// atUserID 为被 @ 的用户 ID，subTop 为该条目的定位标记；
// @所有人时 atUserID 固定为 AtAllTag
export interface AtUser {
  atUserID?: string;
  subTop?: string;
}

export interface BaseInfo {
  url?: string;
  duration?: number;
  size?: number;
  longitude?: number;
  latitude?: number;
  description?: string;
}

// ———— 101 文本 / 106 @文本 ————

export interface TextContent {
  text?: string;
  atUsers?: AtUser[];
  messageEntityList?: unknown[];
}

// 是否 @所有人（atUsers 中存在 AtAllTag）
export function isAtAll(atUsers?: AtUser[]): boolean {
  return !!atUsers?.some((u) => u.atUserID === AtAllTag);
}

// 提取被 @ 的 userID 列表（不含 AtAllTag）
export function atUserIDs(atUsers?: AtUser[]): string[] {
  return (atUsers ?? [])
    .map((u) => u.atUserID)
    .filter((id): id is string => !!id && id !== AtAllTag);
}

// ———— 102 图片 ————

export interface PictureElem {
  url?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  type?: string;
}

export interface PictureContent {
  origPictureElem?: PictureElem;
  bigPictureElem?: PictureElem;
  snapShotElem?: PictureElem;
}

// ———— 103 语音 / 104 视频 / 105 文件 ————

export interface VoiceContent {
  url?: string;
  duration?: number; // 毫秒
  baseInfo?: BaseInfo;
}

export interface VideoContent {
  videoPath?: string;
  videoURL?: string;
  snapshotURL?: string;
  duration?: number; // 毫秒
  baseInfo?: BaseInfo;
}

export interface FileContent {
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  baseInfo?: BaseInfo;
}

// ———— 107 合并转发 ————

export interface MergerMessageEntity {
  senderNickname?: string;
  senderID?: string;
  text?: string;
  contentType?: number;
  time?: number;
}

// 对齐 core pkg/msgcontent/merger.go
export interface MergerContent {
  title?: string;
  isCollapseBirthdayTime?: number;
  messageEntityList?: MergerMessageEntity[];
  nicknameList?: string[];
  platformIDList?: number[];
}

// ———— 108 名片 / 109 位置 / 110 自定义 ————

export interface CardContent {
  userID?: string;
  nickname?: string;
  faceURL?: string;
  data?: string;
}

export interface LocationContent {
  description?: string;
  longitude?: number;
  latitude?: number;
  baseInfo?: BaseInfo;
}

export interface CustomContent {
  data?: string; // 业务自定义负载（通常为 JSON 字符串）
  extension?: string;
  description?: string;
}

// ———— 111 撤回（content 即 MessageRevokedContent）————

export interface RevokeContent {
  revokerID?: string;
  revokerRole?: number;
  clientMsgID?: string;
  revokerNickname?: string;
  revokeTime?: number;
  sourceMessageSendTime?: number;
  sourceMessageSendID?: string;
  sourceMessageSenderNickname?: string;
  sessionType?: number;
  seq?: number;
  ex?: string;
}

// ———— 113 正在输入 ————

export interface TypingContent {
  msgContent?: string;
}

// ———— 114 引用 ————

// 被引用消息摘要：seq/contentType/content/contentMsgID 为服务端识别所需，
// 其余字段（senderNickname、text、elmType 等）由客户端展示自由补充
export interface QuoteMessage {
  clientMsgID?: string;
  seq?: number;
  contentType?: number;
  content?: string;
  sendID?: string;
  sendTime?: number;
  text?: string;
  elmType?: number;
  senderNickname?: string;
  ex?: string;
}

export interface QuoteContent {
  text?: string;
  quoteMessage?: QuoteMessage;
  atUsers?: AtUser[];
  messageEntityList?: unknown[];
}

// ———— 117 高级文本 / 118 Markdown ————

export interface AdvancedTextContent {
  text?: string;
  ex?: string;
}

export interface MarkdownTextContent {
  text?: string;
}

// ———— 202 信令 / 203 自定义通知 ————

export interface SignalContent {
  signalType?: string;
  roomID?: string;
  mediaType?: string;
  ex?: string;
}

export interface CustomNotificationContent {
  serviceName?: string;
  data?: string;
}

// ———— contentType → content 类型映射 ————

export interface ContentTypeMap {
  101: TextContent;
  102: PictureContent;
  103: VoiceContent;
  104: VideoContent;
  105: FileContent;
  106: TextContent;
  107: MergerContent;
  108: CardContent;
  109: LocationContent;
  110: CustomContent;
  111: RevokeContent;
  113: TypingContent;
  114: QuoteContent;
  117: AdvancedTextContent;
  118: MarkdownTextContent;
  119: CustomContent;
  120: CustomContent;
  202: SignalContent;
  203: CustomNotificationContent;
}

export function tryParseJSON<T = unknown>(content?: string): T | undefined {
  if (!content) return undefined;
  try {
    return JSON.parse(content) as T;
  } catch {
    return undefined;
  }
}

export function parseTextContent(content?: string): TextContent | undefined {
  return tryParseJSON<TextContent>(content);
}

export function parseAtTextContent(content?: string): TextContent | undefined {
  return tryParseJSON<TextContent>(content);
}

export function parsePictureContent(content?: string): PictureContent | undefined {
  return tryParseJSON<PictureContent>(content);
}

export function parseVoiceContent(content?: string): VoiceContent | undefined {
  return tryParseJSON<VoiceContent>(content);
}

export function parseVideoContent(content?: string): VideoContent | undefined {
  return tryParseJSON<VideoContent>(content);
}

export function parseFileContent(content?: string): FileContent | undefined {
  return tryParseJSON<FileContent>(content);
}

export function parseMergerContent(content?: string): MergerContent | undefined {
  return tryParseJSON<MergerContent>(content);
}

export function parseCardContent(content?: string): CardContent | undefined {
  return tryParseJSON<CardContent>(content);
}

export function parseLocationContent(content?: string): LocationContent | undefined {
  return tryParseJSON<LocationContent>(content);
}

export function parseCustomContent(content?: string): CustomContent | undefined {
  return tryParseJSON<CustomContent>(content);
}

export function parseRevokeContent(content?: string): RevokeContent | undefined {
  return tryParseJSON<RevokeContent>(content);
}

export function parseTypingContent(content?: string): TypingContent | undefined {
  return tryParseJSON<TypingContent>(content);
}

export function parseQuoteContent(content?: string): QuoteContent | undefined {
  return tryParseJSON<QuoteContent>(content);
}

export function parseSignalContent(content?: string): SignalContent | undefined {
  return tryParseJSON<SignalContent>(content);
}

export function parseCustomNotificationContent(
  content?: string,
): CustomNotificationContent | undefined {
  return tryParseJSON<CustomNotificationContent>(content);
}

// 按 contentType 解析 content；通知类（>=1000）请用 parseNotification 做二次解析
export function parseContent<T extends keyof ContentTypeMap>(
  contentType: T,
  content?: string,
): ContentTypeMap[T] | undefined;
export function parseContent(
  contentType: number,
  content?: string,
): unknown {
  switch (contentType) {
    case ContentType.Text:
    case ContentType.AtText:
      return parseTextContent(content);
    case ContentType.Picture:
      return parsePictureContent(content);
    case ContentType.Voice:
      return parseVoiceContent(content);
    case ContentType.Video:
      return parseVideoContent(content);
    case ContentType.File:
      return parseFileContent(content);
    case ContentType.Merger:
      return parseMergerContent(content);
    case ContentType.Card:
      return parseCardContent(content);
    case ContentType.Location:
      return parseLocationContent(content);
    case ContentType.Custom:
    case ContentType.CustomNotTriggerConversation:
    case ContentType.CustomOnlineOnly:
      return parseCustomContent(content);
    case ContentType.Revoke:
      return parseRevokeContent(content);
    case ContentType.Typing:
      return parseTypingContent(content);
    case ContentType.Quote:
      return parseQuoteContent(content);
    case ContentType.SignalMsg:
      return parseSignalContent(content);
    case ContentType.CustomNotification:
      return parseCustomNotificationContent(content);
    default:
      return tryParseJSON(content);
  }
}

// ———— 构造常用 content（返回可直接写入 MsgData.content 的 JSON 字符串）————

export function buildTextContent(text: string, atUsers?: AtUser[]): string {
  return JSON.stringify({ text, atUsers: atUsers ?? [] } satisfies TextContent);
}

export function buildAtTextContent(text: string, atUsers: AtUser[]): string {
  return JSON.stringify({ text, atUsers } satisfies TextContent);
}

export function buildTypingContent(msgContent = '1'): string {
  return JSON.stringify({ msgContent } satisfies TypingContent);
}

export function buildCustomContent(
  data: string,
  extra: { extension?: string; description?: string } = {},
): string {
  return JSON.stringify({
    data,
    extension: extra.extension ?? '',
    description: extra.description ?? '',
  } satisfies CustomContent);
}

// 用现有消息构造引用体摘要
export function buildQuoteContent(
  text: string,
  quoted: {
    clientMsgID?: string;
    seq?: number;
    contentType?: number;
    content?: string;
    sendID?: string;
    sendTime?: number;
    senderNickname?: string;
  },
  atUsers?: AtUser[],
): string {
  const quoteMessage: QuoteMessage = {
    clientMsgID: quoted.clientMsgID,
    seq: quoted.seq,
    contentType: quoted.contentType,
    content: quoted.content,
    sendID: quoted.sendID,
    sendTime: quoted.sendTime,
    senderNickname: quoted.senderNickname,
  };
  const payload: QuoteContent = { text, quoteMessage };
  if (atUsers) payload.atUsers = atUsers;
  return JSON.stringify(payload);
}
