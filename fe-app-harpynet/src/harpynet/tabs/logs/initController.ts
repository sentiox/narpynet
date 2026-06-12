import {
  inferCountryCode,
  onMount,
  prettyBytes,
  renderCountryFlag,
  showToast,
  stripCountryPrefix,
} from '../../../helpers';
import {
  renderCopyIcon24,
  renderPauseIcon24,
  renderPlayIcon24,
  renderSearchIcon24,
  renderXIcon24,
} from '../../../icons';
import { CustomHarpyNetMethods, HarpyNetShellMethods } from '../../methods';
import { logger, store } from '../../services';
import { logsTranslate as t } from './i18n';

type LogsTabName = 'active' | 'proxy' | 'fullvpn' | 'direct' | 'failure' | 'closed';
type SourceViewMode = 'ip' | 'name';

interface ClashConnection {
  id: string;
  direct?: boolean;
  metadata?: {
    host?: string;
    destinationIP?: string;
    destinationPort?: string;
    network?: string;
    type?: string;
    sourceIP?: string;
    sourcePort?: string;
    processPath?: string;
  };
  chains?: string[];
  rule?: string;
  start?: string;
  upload?: number;
  download?: number;
}

interface LoggedConnection extends ClashConnection {
  closedAt?: number;
}

interface ServiceRule {
  name: string;
  domains?: string[];
  ipPrefixes?: string[];
  reason: string;
  reasonRu: string;
}

interface ServiceInsight {
  name: string;
  reason: string;
  title: string;
  failed: boolean;
}

interface ClashConnectionsResponse {
  connections?: ClashConnection[];
}

const serviceRules: ServiceRule[] = [
  {
    name: 'ChatGPT',
    domains: ['chatgpt.com', 'openai.com', 'oaistatic.com', 'oaiusercontent.com'],
    ipPrefixes: ['8.47.69.'],
    reason: 'OpenAI domain or edge IP',
    reasonRu: 'домен/IP OpenAI',
  },
  {
    name: 'Instagram',
    domains: ['instagram.com', 'cdninstagram.com', 'ig.me', 'threads.net'],
    reason: 'Meta/Instagram domain',
    reasonRu: 'домен Instagram',
  },
  {
    name: 'Meta',
    domains: ['facebook.com', 'fbcdn.net', 'facebook.net', 'whatsapp.net'],
    ipPrefixes: ['157.240.', '31.13.', '66.220.', '69.63.', '69.171.', '173.252.'],
    reason: 'Meta domain or IP range',
    reasonRu: 'домен/IP Meta',
  },
  {
    name: 'Google',
    domains: [
      'google.com',
      'googleapis.com',
      'gstatic.com',
      'googlevideo.com',
      'youtube.com',
      'ytimg.com',
      'ggpht.com',
      'googleusercontent.com',
    ],
    ipPrefixes: [
      '8.8.',
      '8.34.',
      '8.35.',
      '34.',
      '35.',
      '64.233.',
      '66.102.',
      '66.249.',
      '72.14.',
      '74.125.',
      '108.177.',
      '142.250.',
      '142.251.',
      '172.217.',
      '172.253.',
      '173.194.',
      '209.85.',
      '216.58.',
    ],
    reason: 'Google domain or IP range',
    reasonRu: 'домен/IP Google',
  },
  {
    name: 'Telegram',
    domains: ['telegram.org', 't.me', 'tdesktop.com'],
    ipPrefixes: ['91.108.', '95.161.', '149.154.'],
    reason: 'Telegram domain or IP range',
    reasonRu: 'домен/IP Telegram',
  },
  {
    name: 'Discord',
    domains: ['discord.com', 'discord.gg', 'discordapp.com', 'discordapp.net', 'discord.media'],
    reason: 'Discord domain',
    reasonRu: 'домен Discord',
  },
  {
    name: 'Steam',
    domains: ['steampowered.com', 'steamcommunity.com', 'steamstatic.com', 'steamserver.net', 'steamcontent.com'],
    reason: 'Steam domain',
    reasonRu: 'домен Steam',
  },
  {
    name: 'VK',
    domains: ['vk.com', 'vk.ru', 'vkuser.net', 'userapi.com', 'vk-cdn.net'],
    reason: 'VK domain',
    reasonRu: 'домен VK',
  },
  {
    name: 'Yandex',
    domains: ['yandex.ru', 'yandex.net', 'ya.ru', 'yastatic.net', 'yandex.com'],
    reason: 'Yandex domain',
    reasonRu: 'домен Yandex',
  },
  {
    name: 'Cloudflare',
    domains: ['cloudflare.com', 'cloudflare-dns.com'],
    ipPrefixes: [
      '1.1.1.',
      '1.0.0.',
      '104.16.',
      '104.17.',
      '104.18.',
      '104.19.',
      '172.64.',
      '172.65.',
      '172.66.',
      '172.67.',
      '188.114.',
    ],
    reason: 'Cloudflare domain or edge IP',
    reasonRu: 'домен/IP Cloudflare',
  },
  {
    name: 'Huawei Cloud',
    ipPrefixes: ['159.138.'],
    reason: 'Huawei Cloud IP range',
    reasonRu: 'IP Huawei Cloud',
  },
];

const activeConnections = new Map<string, LoggedConnection>();
const closedConnections = new Map<string, LoggedConnection>();
const routeNames = new Map<string, string>();
const deviceNames = new Map<string, string>();
const fullVpnSourceIps = new Set<string>();
const hostChecks = new Map<string, { available: boolean; checkedAt: number }>();
const pendingHostChecks = new Set<string>();
const sourceViewModeStorageKey = 'harpynet.logs.sourceViewMode';
let routeNamesPromise: Promise<void> | undefined;
let deviceNamesPromise: Promise<void> | undefined;
let fullVpnSourceIpsPromise: Promise<void> | undefined;

let activeTab: LogsTabName = 'active';
let sourceViewMode: SourceViewMode =
  localStorage.getItem(sourceViewModeStorageKey) === 'name' ? 'name' : 'ip';
let searchQuery = '';
let paused = false;
let pollingTimer: ReturnType<typeof setInterval> | undefined;
let mounted = false;
let initialized = false;
let fetching = false;

function getConnectionHost(connection: ClashConnection) {
  return (
    connection.metadata?.host ||
    connection.metadata?.destinationIP ||
    t('Unknown', 'РќРµРёР·РІРµСЃС‚РЅРѕ')
  );
}

function getConnectionType(connection: ClashConnection) {
  return (
    connection.metadata?.network ||
    connection.metadata?.type ||
    ''
  ).toLowerCase();
}

function getRoute(connection: ClashConnection) {
  if (connection.direct) {
    return t('Without VPN', 'Без VPN');
  }

  const route = connection.chains?.[0] || connection.rule || 'harpynet';
  return routeNames.get(route) || route;
}

function ipv4ToNumber(ip: string) {
  const parts = ip.split('.').map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return parts.reduce((sum, part) => (sum << 8) + part, 0) >>> 0;
}

function matchesIpv4Cidr(ip: string, cidr: string) {
  const [network, maskRaw] = cidr.split('/');
  const maskBits = Number(maskRaw);
  const ipNumber = ipv4ToNumber(ip);
  const networkNumber = ipv4ToNumber(network);

  if (ipNumber === null || networkNumber === null || !Number.isInteger(maskBits) || maskBits < 0 || maskBits > 32) {
    return false;
  }

  const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0;
  return (ipNumber & mask) === (networkNumber & mask);
}

function isFullVpnSource(connection: ClashConnection) {
  if (connection.direct) {
    return false;
  }

  const sourceIP = connection.metadata?.sourceIP || '';

  if (!sourceIP) {
    return false;
  }

  if (fullVpnSourceIps.has(sourceIP)) {
    return true;
  }

  return Array.from(fullVpnSourceIps).some((entry) => entry.includes('/') && matchesIpv4Cidr(sourceIP, entry));
}

function renderRoute(connection: ClashConnection) {
  const route = getRoute(connection);

  if (connection.direct) {
    return E('span', { class: 'harpynet-route-direct' }, route);
  }

  const country = inferCountryCode(route);
  const routeNode = E('span', { class: 'harpynet-route-with-flag' }, [
    renderCountryFlag(country, route),
    E('span', {}, stripCountryPrefix(route, country)),
  ].filter(Boolean));

  if (isFullVpnSource(connection)) {
    return E('span', {
      class: 'harpynet-route-fullvpn',
      title: `${t('Full VPN', 'Полный VPN')}\n${route}`,
    }, [
      E('span', { class: 'harpynet-route-fullvpn__label' }, t('Full VPN', 'Полный VPN')),
      renderCountryFlag(country, route),
    ]);
  }

  return routeNode;
}

function getProxyName(link: string) {
  const hashIndex = link.indexOf('#');

  if (hashIndex === -1) {
    return '';
  }

  const name = link.slice(hashIndex + 1);

  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

async function loadRouteNames() {
  const response = await HarpyNetShellMethods.getSubscriptionCache('main');

  if (!response.success || !response.data) {
    return;
  }

  for (const [code, link] of Object.entries(response.data)) {
    const name = getProxyName(link);

    if (name) {
      routeNames.set(code, name);
    }
  }
}

function ensureRouteNames() {
  routeNamesPromise ??= loadRouteNames()
    .then(() => {
      if (mounted) {
        renderConnections();
      }
    })
    .catch((error) => {
      logger.error('[LOGS]', 'loadRouteNames failed', error);
    })
    .finally(() => {
      routeNamesPromise = undefined;
    });
  return routeNamesPromise;
}

async function loadFullVpnSourceIps() {
  const sections = await CustomHarpyNetMethods.getConfigSections();
  fullVpnSourceIps.clear();

  for (const section of sections) {
    if (section['.type'] !== 'section') {
      continue;
    }

    const ips = Array.isArray(section.fully_routed_ips)
      ? section.fully_routed_ips
      : section.fully_routed_ips
        ? [section.fully_routed_ips]
        : [];

    for (const ip of ips) {
      if (ip) {
        fullVpnSourceIps.add(ip);
      }
    }
  }
}

function ensureFullVpnSourceIps() {
  fullVpnSourceIpsPromise ??= loadFullVpnSourceIps()
    .then(() => {
      if (mounted) {
        renderConnections();
      }
    })
    .catch((error) => {
      logger.error('[LOGS]', 'loadFullVpnSourceIps failed', error);
    })
    .finally(() => {
      fullVpnSourceIpsPromise = undefined;
    });

  return fullVpnSourceIpsPromise;
}

function getSource(connection: ClashConnection) {
  const sourceIP = connection.metadata?.sourceIP || '';

  if (sourceViewMode === 'name' && sourceIP) {
    return deviceNames.get(sourceIP) || sourceIP;
  }

  return connection.metadata?.processPath || sourceIP || '-';
}

function isCopyableHost(value: string) {
  return Boolean(value && value !== t('Unknown', 'Неизвестно'));
}

function getSourceName(connection: ClashConnection) {
  const sourceIP = connection.metadata?.sourceIP || '';

  return sourceIP ? deviceNames.get(sourceIP) || '' : '';
}

async function loadDeviceNames() {
  const response = await HarpyNetShellMethods.getDhcpClients();

  if (!response.success) {
    return;
  }

  deviceNames.clear();

  for (const [ip, name] of Object.entries(response.data?.clients || {})) {
    if (ip && name) {
      deviceNames.set(ip, name);
    }
  }
}

function ensureDeviceNames() {
  deviceNamesPromise ??= loadDeviceNames()
    .then(() => {
      if (mounted) {
        renderConnections();
      }
    })
    .catch((error) => {
      logger.error('[LOGS]', 'loadDeviceNames failed', error);
    })
    .finally(() => {
      deviceNamesPromise = undefined;
    });

  return deviceNamesPromise;
}

function formatDuration(start?: string, closedAt?: number) {
  const startMs = start ? new Date(start).getTime() : Date.now();
  const endMs = closedAt || Date.now();
  const totalSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function matchesSearch(connection: LoggedConnection) {
  if (!searchQuery) {
    return true;
  }

  const service = getServiceInsight(connection);
  const haystack = [
    getConnectionHost(connection),
    getConnectionType(connection),
    getRoute(connection),
    service.name,
    service.reason,
    getSource(connection),
    connection.metadata?.sourceIP || '',
    getSourceName(connection),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(searchQuery);
}

function getConnectionAgeSeconds(connection: LoggedConnection) {
  const startMs = connection.start ? new Date(connection.start).getTime() : Date.now();
  const endMs = connection.closedAt || Date.now();

  if (!Number.isFinite(startMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((endMs - startMs) / 1000));
}

function isLocalOrBroadcastHost(value: string) {
  const host = value.toLowerCase();

  return (
    host === '255.255.255.255' ||
    host === 'localhost' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith('127.') ||
    host.startsWith('169.254.') ||
    host.startsWith('224.') ||
    host.startsWith('239.')
  );
}

function isIpAddress(value: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value);
}

function normalizeHost(value: string) {
  return value.toLowerCase().replace(/\.$/, '');
}

function matchesDomain(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

function getServiceRule(host: string) {
  const normalizedHost = normalizeHost(host);

  return serviceRules.find((rule) => {
    if (rule.domains?.some((domain) => matchesDomain(normalizedHost, domain))) {
      return true;
    }

    return rule.ipPrefixes?.some((prefix) => normalizedHost.startsWith(prefix));
  });
}

function getServiceRuleReason(rule: ServiceRule) {
  return t(rule.reason, rule.reasonRu);
}

function isFailureCandidate(connection: LoggedConnection) {
  const host = getConnectionHost(connection);

  return Boolean(
    isLowResponseDirectCandidate(connection) ||
      isWebDirectFailureCandidate(connection) ||
      isGameUdpFailureCandidate(connection) ||
      (getFailureProbeHost(connection) && hostChecks.get(host)?.available === false),
  );
}

function isGameUdpPort(port: string) {
  const value = Number(port);

  return (
    value === 1935 ||
    value === 3074 ||
    value === 3659 ||
    value === 5055 ||
    value === 5056 ||
    value === 5058 ||
    value === 5060 ||
    value === 5061 ||
    value === 9000 ||
    value === 9001 ||
    value === 17500 ||
    value === 18000 ||
    value === 20000 ||
    value === 22102 ||
    value === 27015 ||
    value === 27031 ||
    value === 27036 ||
    (value >= 3478 && value <= 3480) ||
    (value >= 5000 && value <= 5500) ||
    (value >= 7777 && value <= 7784) ||
    (value >= 10000 && value <= 10100) ||
    (value >= 12000 && value <= 12200) ||
    (value >= 14000 && value <= 14016) ||
    (value >= 16384 && value <= 16472) ||
    (value >= 27000 && value <= 27100) ||
    (value >= 30000 && value <= 30500) ||
    (value >= 49152 && value <= 65535)
  );
}

function isLowResponseDirectCandidate(connection: LoggedConnection) {
  const host = getConnectionHost(connection);

  if (!connection.direct || !host || isLocalOrBroadcastHost(host)) {
    return false;
  }

  const type = getConnectionType(connection);
  const upload = connection.upload || 0;
  const download = connection.download || 0;
  const age = getConnectionAgeSeconds(connection);
  const destinationPort = Number(connection.metadata?.destinationPort || 0);
  const isLikelyGameTraffic =
    type === 'udp' ||
    isGameUdpPort(String(destinationPort)) ||
    (destinationPort >= 1024 &&
      destinationPort !== 1900 &&
      destinationPort !== 5353);

  if (!isLikelyGameTraffic || upload < 128) {
    return false;
  }

  if (connection.closedAt) {
    return download === 0;
  }

  return download === 0 && age >= 1;
}

function isWebDirectFailureCandidate(connection: LoggedConnection) {
  const host = getConnectionHost(connection);

  if (!connection.direct || !host || isLocalOrBroadcastHost(host)) {
    return false;
  }

  const type = getConnectionType(connection);
  const port = connection.metadata?.destinationPort || '';

  if (type !== 'tcp' || (port !== '80' && port !== '443')) {
    return false;
  }

  const upload = connection.upload || 0;
  const download = connection.download || 0;
  const age = getConnectionAgeSeconds(connection);

  return upload >= 512 && download === 0 && age >= 3;
}

function isGameUdpFailureCandidate(connection: LoggedConnection) {
  if (!connection.direct || getConnectionType(connection) !== 'udp') {
    return false;
  }

  const port = connection.metadata?.destinationPort || '';

  if (!isGameUdpPort(port)) {
    return false;
  }

  const upload = connection.upload || 0;
  const download = connection.download || 0;
  const age = getConnectionAgeSeconds(connection);

  return upload >= 1024 && download < 128 && age >= 10;
}

function getFailureProbeHost(connection: LoggedConnection) {
  if (!connection.direct) {
    return '';
  }

  const host = getConnectionHost(connection);

  if (!host || isIpAddress(host) || isLocalOrBroadcastHost(host)) {
    return '';
  }

  const upload = connection.upload || 0;
  const age = getConnectionAgeSeconds(connection);

  if (upload === 0) {
    return '';
  }

  if (hostChecks.get(host)?.available === false) {
    return host;
  }

  return age >= 5 ? host : '';
}

function getConnectionPort(connection: LoggedConnection) {
  return connection.metadata?.destinationPort || '';
}

function getFailureReason(connection: LoggedConnection) {
  const host = getConnectionHost(connection);

  if (hostChecks.get(host)?.available === false) {
    return t('Does not open: host check failed', 'Не открывается: хост не отвечает');
  }

  if (isGameUdpFailureCandidate(connection)) {
    return t('Does not respond: game UDP', 'Не отвечает: игровой UDP');
  }

  if (isWebDirectFailureCandidate(connection)) {
    return t('Website does not open without VPN', 'Сайт не открывается без VPN');
  }

  if (isLowResponseDirectCandidate(connection)) {
    return t('Does not open via direct route', 'Не открывается без VPN');
  }

  return '';
}

function getServiceInsight(connection: LoggedConnection): ServiceInsight {
  const host = getConnectionHost(connection);
  const type = getConnectionType(connection);
  const port = getConnectionPort(connection);
  const rule = getServiceRule(host);
  const name =
    rule?.name ||
    (isIpAddress(host) ? t('Unknown IP', 'Неизвестный IP') : t('Unknown', 'Неизвестно'));
  const route = getRoute(connection);
  const fullVpnRoute = isFullVpnSource(connection);
  const reasons = [
    rule ? getServiceRuleReason(rule) :
      (isIpAddress(host)
        ? t('Domain is not visible', 'Домен не виден')
        : t('No known service rule matched', 'Сервис не распознан')),
  ];
  const failureReason = activeTab === 'failure' ? getFailureReason(connection) : '';
  const failed = Boolean(failureReason);

  if (failureReason) {
    reasons.push(failureReason);
  }

  if (type === 'udp' && port === '443') {
    reasons.push(t('UDP 443 / QUIC traffic', 'UDP 443 / QUIC-трафик'));
  } else if (type && port) {
    reasons.push(`${type.toUpperCase()} ${port}`);
  }

  reasons.push(
    connection.direct
      ? t('Route: without VPN', 'Маршрут: без VPN')
      : fullVpnRoute
        ? `${t('Route', 'Маршрут')}: ${t('Full VPN', 'Полный VPN')} (${route})`
        : `${t('Route', 'Маршрут')}: ${route}`,
  );

  return {
    name,
    reason: failureReason || reasons[0],
    title: reasons.filter(Boolean).join('\n'),
    failed,
  };
}

function scheduleFailureChecks(connections: LoggedConnection[]) {
  const now = Date.now();

  for (const connection of connections) {
    if (pendingHostChecks.size >= 4) {
      break;
    }

    const host = getFailureProbeHost(connection);

    if (!host || pendingHostChecks.has(host)) {
      continue;
    }

    const lastCheck = hostChecks.get(host);

    if (lastCheck && now - lastCheck.checkedAt < 30000) {
      continue;
    }

    pendingHostChecks.add(host);
    void HarpyNetShellMethods.checkHostAvailability(host)
      .then((response) => {
        if (response.success && response.data) {
          hostChecks.set(host, {
            available: response.data.available,
            checkedAt: Date.now(),
          });
        }
      })
      .catch((error) => {
        logger.error('[LOGS]', 'checkHostAvailability failed', host, error);
      })
      .finally(() => {
        pendingHostChecks.delete(host);

        if (mounted) {
          renderConnections();
        }
      });
  }
}

function getFailureKey(connection: LoggedConnection) {
  const host = getConnectionHost(connection);
  const destination = host && host !== t('Unknown', 'Неизвестно')
    ? host
    : connection.metadata?.destinationIP || '';

  return `${destination}|${connection.metadata?.sourceIP || ''}`;
}

function getUniqueFailureConnections(connections: LoggedConnection[]) {
  const unique = new Map<string, LoggedConnection>();
  const now = Date.now();

  for (const connection of connections) {
    if (!isFailureCandidate(connection)) {
      continue;
    }

    if (connection.closedAt && now - connection.closedAt > 20000) {
      continue;
    }

    const key = getFailureKey(connection);
    const previous = unique.get(key);

    if (!previous || getConnectionAgeSeconds(connection) > getConnectionAgeSeconds(previous)) {
      unique.set(key, connection);
    }
  }

  return Array.from(unique.values());
}

function getVisibleConnections() {
  let source = Array.from(activeConnections.values());

  if (activeTab === 'proxy') {
    source = source.filter((connection) => !connection.direct);
  } else if (activeTab === 'fullvpn') {
    source = source.filter((connection) => isFullVpnSource(connection));
  } else if (activeTab === 'direct') {
    source = source.filter((connection) => connection.direct);
  } else if (activeTab === 'failure') {
    source = getUniqueFailureConnections([
      ...Array.from(activeConnections.values()),
      ...Array.from(closedConnections.values()),
    ]);
  } else if (activeTab === 'closed') {
    source = Array.from(closedConnections.values());
  }

  return source.filter(matchesSearch);
}

function setButtonActive(button: HTMLElement | null, value: boolean) {
  button?.classList.toggle('pdk_logs-page__tab--active', value);
}

function updateControls() {
  const activeButton = document.getElementById('logs-tab-active');
  const proxyButton = document.getElementById('logs-tab-proxy');
  const fullVpnButton = document.getElementById('logs-tab-fullvpn');
  const directButton = document.getElementById('logs-tab-direct');
  const failureButton = document.getElementById('logs-tab-failure');
  const closedButton = document.getElementById('logs-tab-closed');
  const closeAllButton = document.getElementById(
    'logs-close-all',
  ) as HTMLButtonElement | null;
  const pauseButton = document.getElementById('logs-pause-toggle');
  const sourceToggle = document.getElementById('logs-source-toggle');
  const closableConnections = Array.from(activeConnections.values()).filter(
    (connection) => !connection.direct,
  ).length;
  const fullVpnConnections = Array.from(activeConnections.values()).filter(
    (connection) => isFullVpnSource(connection),
  ).length;

  if (activeButton) {
    activeButton.textContent = `${t('Active', 'РђРєС‚РёРІРЅС‹Рµ')} ${activeConnections.size}`;
  }


  if (proxyButton) {
    proxyButton.textContent = `${t('Proxy', 'Прокси')} ${closableConnections}`;
  }

  if (directButton) {
    directButton.textContent = `${t('Without VPN', 'Без VPN')} ${
      activeConnections.size - closableConnections
    }`;
  }
  if (fullVpnButton) {
    fullVpnButton.textContent = `${t('Full VPN', 'Полный VPN')} ${fullVpnConnections}`;
    fullVpnButton.title = t('Device traffic in Full VPN mode', 'Трафик устройств в режиме Полный VPN');
  }
  if (failureButton) {
    const failureConnections = getUniqueFailureConnections([
      ...Array.from(activeConnections.values()),
      ...Array.from(closedConnections.values()),
    ]).length;
    failureButton.textContent = `${t('Failure', 'Сбой')} ${failureConnections}`;
    failureButton.title = t(
      'Suspicious direct connections',
      'Подозрительные соединения без ответа',
    );
  }
  if (closedButton) {
    closedButton.textContent = `${t('Closed', 'Р—Р°РєСЂС‹С‚С‹Рµ')} ${closedConnections.size}`;
  }

  setButtonActive(activeButton, activeTab === 'active');
  setButtonActive(proxyButton, activeTab === 'proxy');
  setButtonActive(fullVpnButton, activeTab === 'fullvpn');
  setButtonActive(directButton, activeTab === 'direct');
  setButtonActive(failureButton, activeTab === 'failure');
  setButtonActive(closedButton, activeTab === 'closed');

  if (closeAllButton) {
    closeAllButton.disabled = closableConnections === 0;
    closeAllButton.innerHTML = '';
    closeAllButton.appendChild(renderXIcon24());
  }

  if (pauseButton) {
    pauseButton.classList.toggle('pdk_logs-page__icon-button--active', paused);
    pauseButton.title = paused
      ? t('Resume updates', 'РџСЂРѕРґРѕР»Р¶РёС‚СЊ РѕР±РЅРѕРІР»РµРЅРёСЏ')
      : t('Pause updates', 'РџР°СѓР·Р° РѕР±РЅРѕРІР»РµРЅРёР№');
    pauseButton.setAttribute('aria-label', pauseButton.title);
    pauseButton.innerHTML = '';
    pauseButton.appendChild(paused ? renderPlayIcon24() : renderPauseIcon24());
  }

  if (sourceToggle) {
    sourceToggle.classList.toggle(
      'pdk_logs-page__source-toggle--active',
      sourceViewMode === 'name',
    );
    sourceToggle.textContent = sourceViewMode === 'name' ? t('Name', 'Имя') : 'IP';
    sourceToggle.title =
      sourceViewMode === 'name'
        ? t('Show source IP', 'Показать IP источника')
        : t('Show device names', 'Показать имена устройств');
    sourceToggle.setAttribute('aria-label', sourceToggle.title);
  }

  const searchIcon = document.querySelector('.pdk_logs-page__search-icon');
  if (searchIcon && !searchIcon.childNodes.length) {
    searchIcon.appendChild(renderSearchIcon24());
  }
}

function renderState(text: string, className: string) {
  return E('div', { class: ['pdk_logs-page__state', className] }, text);
}

function renderConnectionRow(connection: LoggedConnection) {
  const canClose = activeTab !== 'closed' && !connection.direct;
  const host = getConnectionHost(connection);
  const service = getServiceInsight(connection);

  return E('tr', {}, [
    E('td', { 'data-label': t('Host', 'Хост') }, [
      E('div', { class: 'pdk_logs-page__host-cell' }, [
        E('span', { class: 'pdk_logs-page__host-value', title: host }, host),
        isCopyableHost(host)
          ? E(
              'button',
              {
                class: 'btn cbi-button pdk_logs-page__copy-host',
                type: 'button',
                title: t('Copy host', 'Скопировать хост'),
                'aria-label': t('Copy host', 'Скопировать хост'),
                'data-copy-host': host,
              },
              [renderCopyIcon24()],
            )
          : E('span', {}, ''),
      ]),
    ]),
    E('td', { 'data-label': t('Type', 'Тип') }, getConnectionType(connection)),
    E(
      'td',
      { class: 'pdk_logs-page__route', 'data-label': t('Route', 'Маршрут') },
      renderRoute(connection),
    ),
    E('td', { 'data-label': t('Time', 'Время') }, formatDuration(connection.start, connection.closedAt)),
    E('td', { 'data-label': t('Downloaded', 'Загружено') }, prettyBytes(connection.download || 0)),
    E('td', { 'data-label': t('Uploaded', 'Отдано') }, prettyBytes(connection.upload || 0)),
    E('td', { 'data-label': t('Service', 'Сервис') }, [
      E('div', {
        class: [
          'pdk_logs-page__service-cell',
          service.failed ? 'pdk_logs-page__service-cell--failed' : '',
        ].filter(Boolean).join(' '),
        title: service.title,
      }, [
        E('span', { class: 'pdk_logs-page__service-name' }, service.name),
        E('span', { class: 'pdk_logs-page__service-reason' }, service.reason),
      ]),
    ]),
    E('td', { 'data-label': t('Source', 'Источник') }, getSource(connection)),
    E('td', { class: 'pdk_logs-page__action-cell', 'data-label': t('Close', 'Закрыть') }, [
      canClose
        ? E(
            'button',
            {
              class: 'btn cbi-button pdk_logs-page__row-action',
              type: 'button',
              title: t('Close connection', 'Р—Р°РєСЂС‹С‚СЊ СЃРѕРµРґРёРЅРµРЅРёРµ'),
              'aria-label': t('Close connection', 'Р—Р°РєСЂС‹С‚СЊ СЃРѕРµРґРёРЅРµРЅРёРµ'),
              'data-id': connection.id,
            },
            [renderXIcon24()],
          )
        : E('span', {}, ''),
    ]),
  ]);
}

function renderConnections() {
  const container = document.getElementById('logs-connections');

  if (!container) {
    return;
  }

  updateControls();

  const rows = getVisibleConnections();

  if (!rows.length) {
    container.replaceChildren(
      renderState(
        activeTab === 'active'
          ? t('No active connections', 'РќРµС‚ Р°РєС‚РёРІРЅС‹С… СЃРѕРµРґРёРЅРµРЅРёР№')
          : activeTab === 'proxy'
            ? t('No proxy connections', 'Нет прокси-соединений')
            : activeTab === 'fullvpn'
              ? t('No Full VPN connections', 'Нет соединений Полный VPN')
              : activeTab === 'direct'
                ? t('No direct connections', 'Нет соединений без VPN')
                : activeTab === 'failure'
                  ? t('No failure candidates', 'Нет кандидатов для сбоя')
                  : t('No closed connections', 'РќРµС‚ Р·Р°РєСЂС‹С‚С‹С… СЃРѕРµРґРёРЅРµРЅРёР№'),
        'pdk_logs-page__state--empty',
      ),
    );
    return;
  }

  container.replaceChildren(
    E('div', { class: 'pdk_logs-page__table-wrap' }, [
      E('table', { class: 'table cbi-section-table pdk_logs-page__table' }, [
        E('thead', {}, [
          E('tr', {}, [
            E('th', {}, t('Host', 'РҐРѕСЃС‚')),
            E('th', {}, t('Type', 'РўРёРї')),
            E('th', {}, t('Route', 'РњР°СЂС€СЂСѓС‚')),
            E('th', {}, t('Time', 'Р’СЂРµРјСЏ')),
            E('th', {}, `\u2193 ${t('Downloaded', 'Загружено')}`),
            E('th', {}, `\u2191 ${t('Uploaded', 'Отдано')}`),
            E('th', {}, t('Service', 'Сервис')),
            E('th', {}, t('Source', 'РСЃС‚РѕС‡РЅРёРє')),
            E('th', {}, t('Close', 'Р—Р°РєСЂС‹С‚СЊ')),
          ]),
        ]),
        E('tbody', {}, rows.map(renderConnectionRow)),
      ]),
    ]),
  );
}

function trimClosedConnections() {
  const maxClosed = 100;
  const overflow = closedConnections.size - maxClosed;

  if (overflow <= 0) {
    return;
  }

  for (const id of Array.from(closedConnections.keys()).slice(0, overflow)) {
    closedConnections.delete(id);
  }
}

async function fetchConnections() {
  if (!mounted || paused || fetching) {
    return;
  }

  fetching = true;

  try {
    void ensureRouteNames();
    void ensureDeviceNames();
    void ensureFullVpnSourceIps();
    const [response, directResponse] = await Promise.all([
      HarpyNetShellMethods.getClashApiConnections(),
      HarpyNetShellMethods.getDirectConnections(),
    ]);

    if (!response.success) {
      throw response;
    }

    const proxyConnections =
      ((response.data as ClashConnectionsResponse)?.connections || []).filter(
        (connection) => connection.id,
      );
    const proxyTuples = new Set(
      proxyConnections.map((connection) => getConnectionTuple(connection)),
    );
    const directConnections = directResponse.success
      ? ((directResponse.data as ClashConnectionsResponse)?.connections || [])
          .filter(
            (connection) =>
              connection.id && !proxyTuples.has(getConnectionTuple(connection)),
          )
          .map((connection) => ({
            ...connection,
            start:
              activeConnections.get(connection.id)?.start ||
              new Date().toISOString(),
          }))
      : [];
    const nextConnections = [...proxyConnections, ...directConnections];
    const nextIds = new Set(nextConnections.map((connection) => connection.id));
    const now = Date.now();

    for (const [id, connection] of activeConnections.entries()) {
      if (!nextIds.has(id)) {
        activeConnections.delete(id);
        closedConnections.set(id, { ...connection, closedAt: now });
      }
    }

    for (const connection of nextConnections) {
      activeConnections.set(connection.id, {
        ...activeConnections.get(connection.id),
        ...connection,
      });
    }

    trimClosedConnections();
    renderConnections();
  } catch (error) {
    logger.error('[LOGS]', 'fetchConnections failed', error);
    const container = document.getElementById('logs-connections');
    container?.replaceChildren(
      renderState(
        t('Failed to load connections', 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРѕРµРґРёРЅРµРЅРёСЏ'),
        'pdk_logs-page__state--error',
      ),
    );
  } finally {
    fetching = false;
  }
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = undefined;
  }
}

function startPolling() {
  stopPolling();
  void fetchConnections();
  pollingTimer = setInterval(() => {
    void fetchConnections();
  }, 2000);
}

function bindEvents() {
  document.getElementById('logs-tab-active')?.addEventListener('click', () => {
    activeTab = 'active';
    renderConnections();
  });

  document.getElementById('logs-tab-proxy')?.addEventListener('click', () => {
    activeTab = 'proxy';
    renderConnections();
  });

  document.getElementById('logs-tab-fullvpn')?.addEventListener('click', () => {
    activeTab = 'fullvpn';
    renderConnections();
  });

  document.getElementById('logs-tab-direct')?.addEventListener('click', () => {
    activeTab = 'direct';
    renderConnections();
  });

  document.getElementById('logs-tab-failure')?.addEventListener('click', () => {
    activeTab = 'failure';
    renderConnections();
  });

  document.getElementById('logs-tab-closed')?.addEventListener('click', () => {
    activeTab = 'closed';
    renderConnections();
  });

  document.getElementById('logs-pause-toggle')?.addEventListener('click', () => {
    paused = !paused;
    updateControls();

    if (!paused) {
      void fetchConnections();
    }
  });

  document.getElementById('logs-source-toggle')?.addEventListener('click', () => {
    sourceViewMode = sourceViewMode === 'ip' ? 'name' : 'ip';
    localStorage.setItem(sourceViewModeStorageKey, sourceViewMode);
    void ensureDeviceNames();
    renderConnections();
  });

  document.getElementById('logs-close-all')?.addEventListener('click', async () => {
    const response = await HarpyNetShellMethods.closeAllClashApiConnections();

    if (!response.success) {
      showToast(
        t('Failed to close connections', 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РєСЂС‹С‚СЊ СЃРѕРµРґРёРЅРµРЅРёСЏ'),
        'error',
      );
      return;
    }

    const now = Date.now();
    for (const [id, connection] of activeConnections.entries()) {
      if (connection.direct) {
        continue;
      }

      activeConnections.delete(id);
      closedConnections.set(id, { ...connection, closedAt: now });
    }
    trimClosedConnections();
    renderConnections();
  });

  document.getElementById('logs-search')?.addEventListener('input', (event) => {
    searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
    renderConnections();
  });

  document.getElementById('logs-connections')?.addEventListener('click', async (event) => {
    const copyButton = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '.pdk_logs-page__copy-host',
    );

    if (copyButton?.dataset.copyHost) {
      await copyToClipboard(copyButton.dataset.copyHost);
      showToast(
        `${t('Copied', 'Скопировано')}: ${copyButton.dataset.copyHost}`,
        'success',
      );
      return;
    }

    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '.pdk_logs-page__row-action',
    );

    if (!button?.dataset.id) {
      return;
    }

    const id = button.dataset.id;
    const response = await HarpyNetShellMethods.closeClashApiConnection(id);

    if (!response.success) {
      showToast(
        t('Failed to close connections', 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РєСЂС‹С‚СЊ СЃРѕРµРґРёРЅРµРЅРёСЏ'),
        'error',
      );
      return;
    }

    const connection = activeConnections.get(id);
    activeConnections.delete(id);

    if (connection) {
      closedConnections.set(id, { ...connection, closedAt: Date.now() });
    }

    trimClosedConnections();
    renderConnections();
  });
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function getConnectionTuple(connection: ClashConnection) {
  const metadata = connection.metadata;

  return [
    metadata?.network || metadata?.type || '',
    metadata?.sourceIP || '',
    metadata?.sourcePort || '',
    metadata?.destinationIP || '',
    metadata?.destinationPort || '',
  ].join('|');
}

export function initController() {
  if (initialized) {
    return;
  }

  initialized = true;

  store.subscribe((next, prev, diff) => {
    if (diff.tabService && next.tabService.current !== prev.tabService.current) {
      if (next.tabService.current === 'logs') {
        mounted = true;
        startPolling();
      } else {
        mounted = false;
        stopPolling();
      }
    }
  });

  onMount('logs-status').then(async () => {
    mounted = true;
    bindEvents();
    void ensureRouteNames();
    void ensureDeviceNames();
    void ensureFullVpnSourceIps();
    updateControls();

    if (store.get().tabService.current === 'logs') {
      startPolling();
    }
  });
}
