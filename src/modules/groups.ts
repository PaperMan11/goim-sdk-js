import type { GroupInfo } from '../types';
import { ModuleBase } from './base';

export class GroupsModule extends ModuleBase {
  getGroupsInfo(groupIDs: string[]): Promise<GroupInfo[]> {
    return this.goim.call('GroupMgr.GetGroupsInfo', [groupIDs]);
  }
}
