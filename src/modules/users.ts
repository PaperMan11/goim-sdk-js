import type { UserInfo } from '../types';
import { ModuleBase } from './base';

export class UsersModule extends ModuleBase {
  // 未注册用户也可调用（Go 侧白名单），用于登录后补昵称/头像
  register(users: UserInfo[]): Promise<void> {
    return this.goim.call('UserMgr.Register', [users]);
  }

  getUsersInfo(userIDs: string[]): Promise<UserInfo[]> {
    return this.goim.call('UserMgr.GetUsersInfo', [userIDs]);
  }
}
