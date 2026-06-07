import {
  inferCountryCode,
  onMount,
  prettyBytes,
  renderCountryFlag,
  showToast,
  stripCountryPrefix,
} from '../../../helpers';
import {
  renderPauseIcon24,
  renderPlayIcon24,
  renderSearchIcon24,
  renderXIcon24,
} from '../../../icons';
import { HarpyNetShellMethods } from '../../methods';
import { logger, store } from '../../services';
import { logsTranslate as t } from './i18n';

type LogsTabName = 'active' | 'proxy' | 'direct' | 'closed';
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

interface ClashConnectionsResponse {
  connections?: ClashConnection[];
}

const activeConnections = new Map<string, LoggedConnection>();
const closedConnections = new Map<string, LoggedConnection>();
const routeNames = new Map<string, string>();
const deviceNames = new Map<string, string>();
let routeNamesPromise: Promise<void> | undefined;
let deviceNamesPromise: Promise<void> | undefined;

let activeTab: LogsTabName = 'active';
let sourceViewMode: SourceViewMode = 'ip';
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

function renderRoute(connection: ClashConnection) {
  const route = getRoute(connection);

  if (connection.direct) {
    return E('span', { class: 'harpynet-route-direct' }, route);
  }

  const country = inferCountryCode(route);
  return E('span', { class: 'harpynet-route-with-flag' }, [
    renderCountryFlag(country, route),
    E('span', {}, stripCountryPrefix(route, country)),
  ].filter(Boolean));
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

function getSource(connection: ClashConnection) {
  const sourceIP = connection.metadata?.sourceIP || '';

  if (sourceViewMode === 'name' && sourceIP) {
    return deviceNames.get(sourceIP) || sourceIP;
  }

  return connection.metadata?.processPath || sourceIP || '-';
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

  const haystack = [
    getConnectionHost(connection),
    getConnectionType(connection),
    getRoute(connection),
    getSource(connection),
    connection.metadata?.sourceIP || '',
    getSourceName(connection),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(searchQuery);
}

function getVisibleConnections() {
  let source = Array.from(activeConnections.values());

  if (activeTab === 'proxy') {
    source = source.filter((connection) => !connection.direct);
  } else if (activeTab === 'direct') {
    source = source.filter((connection) => connection.direct);
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
  const directButton = document.getElementById('logs-tab-direct');
  const closedButton = document.getElementById('logs-tab-closed');
  const closeAllButton = document.getElementById(
    'logs-close-all',
  ) as HTMLButtonElement | null;
  const pauseButton = document.getElementById('logs-pause-toggle');
  const sourceToggle = document.getElementById('logs-source-toggle');
  const closableConnections = Array.from(activeConnections.values()).filter(
    (connection) => !connection.direct,
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
  if (closedButton) {
    closedButton.textContent = `${t('Closed', 'Р—Р°РєСЂС‹С‚С‹Рµ')} ${closedConnections.size}`;
  }

  setButtonActive(activeButton, activeTab === 'active');
  setButtonActive(proxyButton, activeTab === 'proxy');
  setButtonActive(directButton, activeTab === 'direct');
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

  return E('tr', {}, [
    E('td', { 'data-label': t('Host', 'Хост') }, getConnectionHost(connection)),
    E('td', { 'data-label': t('Type', 'Тип') }, getConnectionType(connection)),
    E(
      'td',
      { class: 'pdk_logs-page__route', 'data-label': t('Route', 'Маршрут') },
      renderRoute(connection),
    ),
    E('td', { 'data-label': t('Time', 'Время') }, formatDuration(connection.start, connection.closedAt)),
    E('td', { 'data-label': t('Downloaded', 'Загружено') }, prettyBytes(connection.download || 0)),
    E('td', { 'data-label': t('Uploaded', 'Отдано') }, prettyBytes(connection.upload || 0)),
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
            : activeTab === 'direct'
              ? t('No direct connections', 'Нет соединений без VPN')
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

  document.getElementById('logs-tab-direct')?.addEventListener('click', () => {
    activeTab = 'direct';
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
    updateControls();

    if (store.get().tabService.current === 'logs') {
      startPolling();
    }
  });
}
