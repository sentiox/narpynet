// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ClashAPI {
  export interface ProxyHistoryEntry {
    time: string;
    delay: number;
  }

  export interface ProxyBase {
    type: string;
    name: string;
    udp: boolean;
    history: ProxyHistoryEntry[];
    now?: string;
    all?: string[];
  }

  export interface Proxies {
    proxies: Record<string, ProxyBase>;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace HarpyNet {
  // Available commands:
  // start                   Start harpynet service
  // stop                    Stop harpynet service
  // reload                  Reload harpynet configuration
  // restart                 Restart harpynet service
  // enable                  Enable harpynet autostart
  // disable                 Disable harpynet autostart
  // main                    Run main harpynet process
  // list_update             Update domain lists
  // check_proxy             Check proxy connectivity
  // check_nft               Check NFT rules
  // check_nft_rules         Check NFT rules status
  // check_sing_box          Check sing-box installation and status
  // check_logs              Show harpynet logs from system journal
  // check_sing_box_logs     Show sing-box logs
  // get_subscription_cache  Get cached subscription links for dashboard
  // get_subscription_metadata Get subscription traffic and expiry metadata
  // check_fakeip            Test FakeIP on router
  // clash_api               Clash API interface for managing proxies and groups
  // show_config             Display current harpynet configuration
  // show_version            Show harpynet version
  // show_sing_box_config    Show sing-box configuration
  // show_sing_box_version   Show sing-box version
  // show_system_info        Show system information
  // get_status              Get harpynet service status
  // get_sing_box_status     Get sing-box service status
  // check_dns_available     Check DNS server availability
  // global_check            Run global system check

  export enum AvailableMethods {
    CHECK_DNS_AVAILABLE = 'check_dns_available',
    CHECK_FAKEIP = 'check_fakeip',
    CHECK_NFT_RULES = 'check_nft_rules',
    GET_STATUS = 'get_status',
    CHECK_SING_BOX = 'check_sing_box',
    GET_SING_BOX_STATUS = 'get_sing_box_status',
    CLASH_API = 'clash_api',
    SUBSCRIPTION_UPDATE = 'subscription_update',
    RESTART = 'restart',
    START = 'start',
    STOP = 'stop',
    ENABLE = 'enable',
    DISABLE = 'disable',
    GLOBAL_CHECK = 'global_check',
    SHOW_SING_BOX_CONFIG = 'show_sing_box_config',
    CHECK_LOGS = 'check_logs',
    GET_SUBSCRIPTION_CACHE = 'get_subscription_cache',
    GET_SUBSCRIPTION_METADATA = 'get_subscription_metadata',
    GET_SYSTEM_INFO = 'get_system_info',
    GET_DIRECT_CONNECTIONS = 'get_direct_connections',
    GET_DHCP_CLIENTS = 'get_dhcp_clients',
  }

  export enum AvailableClashAPIMethods {
    GET_PROXIES = 'get_proxies',
    GET_PROXY_LATENCY = 'get_proxy_latency',
    GET_GROUP_LATENCY = 'get_group_latency',
    SET_GROUP_PROXY = 'set_group_proxy',
    GET_CONNECTIONS = 'get_connections',
    CLOSE_CONNECTION = 'close_connection',
    CLOSE_ALL_CONNECTIONS = 'close_all_connections',
  }

  export interface Outbound {
    code: string;
    displayName: string;
    latency: number;
    type: string;
    selected: boolean;
    link?: string;
    canCopyLink?: boolean;
    country?: string;
  }

  export interface OutboundGroup {
    withTagSelect: boolean;
    code: string;
    sectionName: string;
    displayName: string;
    latencyTestCode?: string;
    subscriptionSourceCount?: number;
    subscriptionMetadata?: SubscriptionMetadata[];
    outbounds: Outbound[];
  }

  export interface SubscriptionMetadata {
    version?: number;
    title?: string;
    traffic?: {
      upload?: number;
      download?: number;
      used?: number;
      total?: number;
      remaining?: number;
      isUnlimited?: boolean;
    };
    expire?: number;
    refillDate?: number;
    webPageUrl?: string;
    supportUrl?: string;
    announce?: string;
    announceUrl?: string;
  }

  export interface ConfigProxySubscriptionSection {
    connection_type: 'proxy';
    proxy_config_type: 'subscription';
    subscription_url: string;
  }

  export interface ConfigExclusionSection {
    connection_type: 'exclusion';
  }

  export type ConfigBaseSection =
    | ConfigProxySubscriptionSection
    | ConfigExclusionSection;

  export type ConfigSection = ConfigBaseSection & {
    '.name': string;
    '.type': 'settings' | 'section';
    yacd_secret_key?: string;
  };

  export interface MethodSuccessResponse<T> {
    success: true;
    data: T;
  }

  export interface MethodFailureResponse {
    success: false;
    error: string;
  }

  export type MethodResponse<T> =
    | MethodSuccessResponse<T>
    | MethodFailureResponse;

  export interface DnsCheckResult {
    dns_type: 'udp' | 'doh' | 'dot';
    dns_server: string;
    dns_status: 0 | 1;
    dns_on_router: 0 | 1;
    bootstrap_dns_server: string;
    bootstrap_dns_status: 0 | 1;
    dhcp_config_status: 0 | 1;
  }

  export interface NftRulesCheckResult {
    table_exist: 0 | 1;
    rules_mangle_exist: 0 | 1;
    rules_mangle_counters: 0 | 1;
    rules_mangle_output_exist: 0 | 1;
    rules_mangle_output_counters: 0 | 1;
    rules_proxy_exist: 0 | 1;
    rules_proxy_counters: 0 | 1;
    rules_other_mark_exist: 0 | 1;
  }

  export interface SingBoxCheckResult {
    sing_box_installed: 0 | 1;
    sing_box_version_ok: 0 | 1;
    sing_box_service_exist: 0 | 1;
    sing_box_autostart_disabled: 0 | 1;
    sing_box_process_running: 0 | 1;
    sing_box_ports_listening: 0 | 1;
  }

  export interface FakeIPCheckResult {
    fakeip: boolean;
    IP: string;
  }

  export interface GetStatus {
    enabled: number;
    status: string;
  }

  export interface GetSingBoxStatus {
    running: number;
    enabled: number;
    status: string;
  }

  export interface GetSystemInfo {
    harpynet_version: string;
    harpynet_latest_version: string;
    luci_app_version: string;
    sing_box_version: string;
    openwrt_version: string;
    device_model: string;
  }

  export interface GetClashApiProxyLatency {
    delay: number;
    message?: string;
  }

  export type GetClashApiGroupLatency = Record<string, number>;
}
