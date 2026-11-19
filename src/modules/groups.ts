import {
  GroupJoinSource,
  type GroupAbstractInfo,
  type GroupInfo,
  type GroupInfoExOptions,
  type GroupInfoForSet,
  type GroupMemberFullInfo,
  type RequestPagination,
  type SetGroupMemberInfo,
} from '../types';
import { ModuleBase } from './base';

const DEFAULT_PAGINATION: RequestPagination = { pageNumber: 1, showNumber: 20 };

export interface GroupMemberListResult {
  total: number;
  members: GroupMemberFullInfo[];
}

export interface JoinedGroupListResult {
  total: number;
  groups: GroupInfo[];
}

export class GroupsModule extends ModuleBase {
  // ———— 群资料 ————

  getGroupsInfo(groupIDs: string[]): Promise<GroupInfo[]> {
    return this.goim.call('GroupMgr.GetGroupsInfo', [groupIDs]);
  }

  // 建群：groupInfo 至少包含 groupName，memberUserIDs 为初始成员
  createGroup(
    groupInfo: GroupInfo,
    memberUserIDs: string[] = [],
    adminUserIDs: string[] = [],
    ownerUserID = this.goim.requireUserID(),
    sendMessage = true,
  ): Promise<GroupInfo> {
    return this.goim.call('GroupMgr.CreateGroup', [
      groupInfo,
      memberUserIDs,
      adminUserIDs,
      ownerUserID,
      sendMessage,
    ]);
  }

  setGroupInfo(groupInfo: GroupInfoForSet): Promise<void> {
    return this.goim.call('GroupMgr.SetGroupInfo', [groupInfo]);
  }

  setGroupInfoEx(groupID: string, options: GroupInfoExOptions): Promise<void> {
    return this.goim.call('GroupMgr.SetGroupInfoEx', [groupID, options]);
  }

  getGroupAbstractInfo(groupIDs: string[]): Promise<GroupAbstractInfo[]> {
    return this.goim.call('GroupMgr.GetGroupAbstractInfo', [groupIDs]);
  }

  // ———— 入群 / 退群 ————

  // joinSource 建议用 GroupJoinSource；邀请加入时带 inviterUserID
  joinGroup(
    groupID: string,
    reqMessage = '',
    joinSource: number = GroupJoinSource.Search,
    inviterUserID = '',
    ex = '',
  ): Promise<void> {
    return this.goim.call('GroupMgr.JoinGroup', [
      groupID,
      reqMessage,
      joinSource,
      inviterUserID,
      ex,
    ]);
  }

  quitGroup(groupID: string, userID = this.goim.requireUserID()): Promise<void> {
    return this.goim.call('GroupMgr.QuitGroup', [groupID, userID]);
  }

  // 处理入群申请：handleResult 建议用 GroupApplicationResult
  groupApplicationResponse(
    groupID: string,
    fromUserID: string,
    handledMsg: string,
    handleResult: number,
  ): Promise<void> {
    return this.goim.call('GroupMgr.GroupApplicationResponse', [
      groupID,
      fromUserID,
      handledMsg,
      handleResult,
    ]);
  }

  // 转让群主：oldOwnerUserID 默认当前用户
  transferGroup(
    groupID: string,
    newOwnerUserID: string,
    oldOwnerUserID = this.goim.requireUserID(),
  ): Promise<void> {
    return this.goim.call('GroupMgr.TransferGroup', [
      groupID,
      oldOwnerUserID,
      newOwnerUserID,
    ]);
  }

  dismissGroup(
    groupID: string,
    deleteMember = true,
    sendMessage = true,
  ): Promise<void> {
    return this.goim.call('GroupMgr.DismissGroup', [
      groupID,
      deleteMember,
      sendMessage,
    ]);
  }

  // ———— 成员管理 ————

  getGroupMembersInfo(
    groupID: string,
    userIDs: string[],
  ): Promise<GroupMemberFullInfo[]> {
    return this.goim.call('GroupMgr.GetGroupMembersInfo', [groupID, userIDs]);
  }

  // filter：0 全部（服务端定义）/ keyword 模糊搜索；返回 [总数, 成员列表]
  async getGroupMemberList(
    groupID: string,
    pagination: RequestPagination = DEFAULT_PAGINATION,
    filter = 0,
    keyword = '',
  ): Promise<GroupMemberListResult> {
    const [total, members] = await this.goim.call<
      [number, GroupMemberFullInfo[]]
    >('GroupMgr.GetGroupMemberList', [pagination, groupID, filter, keyword]);
    return { total, members: members ?? [] };
  }

  async getJoinedGroupList(
    userID = this.goim.requireUserID(),
    pagination: RequestPagination = DEFAULT_PAGINATION,
  ): Promise<JoinedGroupListResult> {
    const [total, groups] = await this.goim.call<[number, GroupInfo[]]>(
      'GroupMgr.GetJoinedGroupList',
      [userID, pagination],
    );
    return { total, groups: groups ?? [] };
  }

  kickGroup(
    groupID: string,
    kickedUserIDs: string[],
    reason = '',
    sendMessage = true,
  ): Promise<void> {
    return this.goim.call('GroupMgr.KickGroup', [
      groupID,
      kickedUserIDs,
      reason,
      sendMessage,
    ]);
  }

  inviteUserToGroup(
    groupID: string,
    invitedUserIDs: string[],
    reason = '',
    sendMessage = true,
  ): Promise<void> {
    return this.goim.call('GroupMgr.InviteUserToGroup', [
      groupID,
      reason,
      invitedUserIDs,
      sendMessage,
    ]);
  }

  // mutedSeconds 为禁言时长（秒），0 表示取消
  muteGroupMember(
    groupID: string,
    userID: string,
    mutedSeconds: number,
  ): Promise<void> {
    return this.goim.call('GroupMgr.MuteGroupMember', [
      groupID,
      userID,
      mutedSeconds,
    ]);
  }

  // 全员禁言
  muteGroup(groupID: string): Promise<void> {
    return this.goim.call('GroupMgr.MuteGroup', [groupID]);
  }

  cancelMuteGroup(groupID: string): Promise<void> {
    return this.goim.call('GroupMgr.CancelMuteGroup', [groupID]);
  }

  cancelMuteGroupMember(groupID: string, userID: string): Promise<void> {
    return this.goim.call('GroupMgr.CancelMuteGroupMember', [groupID, userID]);
  }

  setGroupMemberInfo(members: SetGroupMemberInfo[]): Promise<void> {
    return this.goim.call('GroupMgr.SetGroupMemberInfo', [members]);
  }
}
