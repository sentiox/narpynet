import { callBaseMethod } from './callBaseMethod';
import { ClashAPI, HarpyNet } from '../../types';

export const HarpyNetShellMethods = {
  checkDNSAvailable: async () =>
    callBaseMethod<HarpyNet.DnsCheckResult>(
      HarpyNet.AvailableMethods.CHECK_DNS_AVAILABLE,
    ),
  checkFakeIP: async () =>
    callBaseMethod<HarpyNet.FakeIPCheckResult>(
      HarpyNet.AvailableMethods.CHECK_FAKEIP,
    ),
  checkNftRules: async () =>
    callBaseMethod<HarpyNet.NftRulesCheckResult>(
      HarpyNet.AvailableMethods.CHECK_NFT_RULES,
    ),
  getStatus: async () =>
    callBaseMethod<HarpyNet.GetStatus>(HarpyNet.AvailableMethods.GET_STATUS),
  checkSingBox: async () =>
    callBaseMethod<HarpyNet.SingBoxCheckResult>(
      HarpyNet.AvailableMethods.CHECK_SING_BOX,
    ),
  getSingBoxStatus: async () =>
    callBaseMethod<HarpyNet.GetSingBoxStatus>(
      HarpyNet.AvailableMethods.GET_SING_BOX_STATUS,
    ),
  getClashApiProxies: async () =>
    callBaseMethod<ClashAPI.Proxies>(HarpyNet.AvailableMethods.CLASH_API, [
      HarpyNet.AvailableClashAPIMethods.GET_PROXIES,
    ]),
  getClashApiConnections: async () =>
    callBaseMethod<unknown>(HarpyNet.AvailableMethods.CLASH_API, [
      HarpyNet.AvailableClashAPIMethods.GET_CONNECTIONS,
    ]),
  getDirectConnections: async () =>
    callBaseMethod<unknown>(HarpyNet.AvailableMethods.GET_DIRECT_CONNECTIONS),
  getDhcpClients: async () =>
    callBaseMethod<{ clients?: Record<string, string> }>(
      HarpyNet.AvailableMethods.GET_DHCP_CLIENTS,
    ),
  getClashApiProxyLatency: async (tag: string) =>
    callBaseMethod<HarpyNet.GetClashApiProxyLatency>(
      HarpyNet.AvailableMethods.CLASH_API,
      [HarpyNet.AvailableClashAPIMethods.GET_PROXY_LATENCY, tag, '5000'],
    ),
  getClashApiGroupLatency: async (tag: string) =>
    callBaseMethod<HarpyNet.GetClashApiGroupLatency>(
      HarpyNet.AvailableMethods.CLASH_API,
      [HarpyNet.AvailableClashAPIMethods.GET_GROUP_LATENCY, tag, '10000'],
    ),
  setClashApiGroupProxy: async (group: string, proxy: string) =>
    callBaseMethod<unknown>(HarpyNet.AvailableMethods.CLASH_API, [
      HarpyNet.AvailableClashAPIMethods.SET_GROUP_PROXY,
      group,
      proxy,
    ]),
  closeClashApiConnection: async (id: string) =>
    callBaseMethod<unknown>(HarpyNet.AvailableMethods.CLASH_API, [
      HarpyNet.AvailableClashAPIMethods.CLOSE_CONNECTION,
      id,
    ]),
  closeAllClashApiConnections: async () =>
    callBaseMethod<unknown>(HarpyNet.AvailableMethods.CLASH_API, [
      HarpyNet.AvailableClashAPIMethods.CLOSE_ALL_CONNECTIONS,
    ]),
  updateSubscription: async () =>
    callBaseMethod<{ success: boolean }>(
      HarpyNet.AvailableMethods.SUBSCRIPTION_UPDATE,
      [],
      '/usr/bin/harpynet',
      60000,
    ),
  restart: async () =>
    callBaseMethod<unknown>(
      HarpyNet.AvailableMethods.RESTART,
      [],
      '/etc/init.d/harpynet',
    ),
  start: async () =>
    callBaseMethod<unknown>(
      HarpyNet.AvailableMethods.START,
      [],
      '/etc/init.d/harpynet',
    ),
  stop: async () =>
    callBaseMethod<unknown>(
      HarpyNet.AvailableMethods.STOP,
      [],
      '/etc/init.d/harpynet',
    ),
  enable: async () =>
    callBaseMethod<unknown>(
      HarpyNet.AvailableMethods.ENABLE,
      [],
      '/etc/init.d/harpynet',
    ),
  disable: async () =>
    callBaseMethod<unknown>(
      HarpyNet.AvailableMethods.DISABLE,
      [],
      '/etc/init.d/harpynet',
    ),
  globalCheck: async () =>
    callBaseMethod<unknown>(HarpyNet.AvailableMethods.GLOBAL_CHECK),
  showSingBoxConfig: async () =>
    callBaseMethod<unknown>(HarpyNet.AvailableMethods.SHOW_SING_BOX_CONFIG),
  checkLogs: async () =>
    callBaseMethod<unknown>(HarpyNet.AvailableMethods.CHECK_LOGS),
  getSubscriptionCache: async (section: string) =>
    callBaseMethod<Record<string, string>>(
      HarpyNet.AvailableMethods.GET_SUBSCRIPTION_CACHE,
      [section],
    ),
  getSubscriptionMetadata: async (section: string) =>
    callBaseMethod<HarpyNet.SubscriptionMetadata>(
      HarpyNet.AvailableMethods.GET_SUBSCRIPTION_METADATA,
      [section],
    ),
  getSystemInfo: async () =>
    callBaseMethod<HarpyNet.GetSystemInfo>(
      HarpyNet.AvailableMethods.GET_SYSTEM_INFO,
    ),
};
