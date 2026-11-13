import { ModuleBase } from './base';

// AuthMgr 方法：
//   GetUserToken 需要 admin 身份，Web 端不直接调用；
//   登录统一走 client.login / loginWithToken。
export class AuthModule extends ModuleBase {
  login(userID: string, platformID?: number): Promise<void> {
    return this.goim.login(userID, platformID);
  }

  loginWithToken(
    userID: string,
    token: string,
    expireTimeSeconds: number,
    platformID?: number,
  ): Promise<void> {
    return this.goim.loginWithToken(userID, token, expireTimeSeconds, platformID);
  }

  logout(clearData = false): Promise<void> {
    return this.goim.logout(clearData);
  }

  parseToken(token: string): Promise<{ token: string; userID?: string }> {
    return this.goim.call('AuthMgr.ParseToken', [token]);
  }
}
