import {
  getClashWsUrl,
  onMount,
  preserveScrollForPage,
} from '../../../helpers';
import { prettyBytes } from '../../../helpers/prettyBytes';
import { CustomHarpyNetMethods, HarpyNetShellMethods } from '../../methods';
import { logger, socket, store, StoreType } from '../../services';
import { renderSections, renderWidget } from './partials';
import { fetchServicesInfo } from '../../fetchers';
import { getClashApiSecret } from '../../methods/custom/getClashApiSecret';

const SECTIONS_REFRESH_INTERVAL_MS = 10000;
let sectionsRefreshTimer: ReturnType<typeof setInterval> | null = null;

// Fetchers

async function fetchDashboardSections() {
  const prev = store.get().sectionsWidget;

  store.set({
    sectionsWidget: {
      ...prev,
      failed: false,
    },
  });

  const { data, success } = await CustomHarpyNetMethods.getDashboardSections();

  if (!success) {
    logger.error('[DASHBOARD]', 'fetchDashboardSections: failed to fetch');
  }

  store.set({
    sectionsWidget: {
      ...store.get().sectionsWidget,
      loading: false,
      failed: !success,
      data: success ? data : store.get().sectionsWidget.data,
    },
  });
}

async function connectToClashSockets() {
  const clashApiSecret = await getClashApiSecret();

  socket.subscribe(
    `${getClashWsUrl()}/traffic?token=${clashApiSecret}`,
    (msg) => {
      const parsedMsg = JSON.parse(msg);

      store.set({
        bandwidthWidget: {
          loading: false,
          failed: false,
          data: { up: parsedMsg.up, down: parsedMsg.down },
        },
      });
    },
    (_err) => {
      logger.error(
        '[DASHBOARD]',
        'connectToClashSockets - traffic: failed to connect to',
        getClashWsUrl(),
      );
      store.set({
        bandwidthWidget: {
          loading: false,
          failed: true,
          data: { up: 0, down: 0 },
        },
      });
    },
  );

  socket.subscribe(
    `${getClashWsUrl()}/connections?token=${clashApiSecret}`,
    (msg) => {
      const parsedMsg = JSON.parse(msg);

      store.set({
        trafficTotalWidget: {
          loading: false,
          failed: false,
          data: {
            downloadTotal: parsedMsg.downloadTotal,
            uploadTotal: parsedMsg.uploadTotal,
          },
        },
        systemInfoWidget: {
          loading: false,
          failed: false,
          data: {
            connections: parsedMsg.connections?.length,
            memory: parsedMsg.memory,
          },
        },
      });
    },
    (_err) => {
      logger.error(
        '[DASHBOARD]',
        'connectToClashSockets - connections: failed to connect to',
        getClashWsUrl(),
      );
      store.set({
        trafficTotalWidget: {
          loading: false,
          failed: true,
          data: { downloadTotal: 0, uploadTotal: 0 },
        },
        systemInfoWidget: {
          loading: false,
          failed: true,
          data: {
            connections: 0,
            memory: 0,
          },
        },
      });
    },
  );
}

// Handlers

async function handleChooseOutbound(
  sectionName: string,
  selector: string,
  tag: string,
) {
  const current = store.get().sectionsWidget;
  store.set({
    sectionsWidget: {
      ...current,
      selectorSwitchingSections: {
        ...current.selectorSwitchingSections,
        [sectionName]: tag,
      },
    },
  });

  try {
    await HarpyNetShellMethods.setClashApiGroupProxy(selector, tag);
    await fetchDashboardSections();
  } finally {
    const next = store.get().sectionsWidget;
    const switching = { ...next.selectorSwitchingSections };
    delete switching[sectionName];
    store.set({
      sectionsWidget: { ...next, selectorSwitchingSections: switching },
    });
  }
}

async function handleTestGroupLatency(sectionName: string, tag: string) {
  const current = store.get().sectionsWidget;
  store.set({
    sectionsWidget: {
      ...current,
      latencyFetchingSections: {
        ...current.latencyFetchingSections,
        [sectionName]: true,
      },
    },
  });

  try {
    await HarpyNetShellMethods.getClashApiGroupLatency(tag);
    await fetchDashboardSections();
  } finally {
    const next = store.get().sectionsWidget;
    const fetching = { ...next.latencyFetchingSections };
    delete fetching[sectionName];
    store.set({
      sectionsWidget: { ...next, latencyFetchingSections: fetching },
    });
  }
}

async function handleTestProxyLatency(sectionName: string, tag: string) {
  const current = store.get().sectionsWidget;
  store.set({
    sectionsWidget: {
      ...current,
      latencyFetchingSections: {
        ...current.latencyFetchingSections,
        [sectionName]: true,
      },
    },
  });

  try {
    await HarpyNetShellMethods.getClashApiProxyLatency(tag);
    await fetchDashboardSections();
  } finally {
    const next = store.get().sectionsWidget;
    const fetching = { ...next.latencyFetchingSections };
    delete fetching[sectionName];
    store.set({
      sectionsWidget: { ...next, latencyFetchingSections: fetching },
    });
  }
}

async function handleUpdateSubscription(sectionName: string) {
  const current = store.get().sectionsWidget;
  store.set({
    sectionsWidget: {
      ...current,
      subscriptionUpdatingSections: {
        ...current.subscriptionUpdatingSections,
        [sectionName]: true,
      },
    },
  });

  try {
    const response = await HarpyNetShellMethods.updateSubscription();

    if (!response.success || !response.data?.success) {
      throw new Error('Subscription update failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
    await fetchDashboardSections();
    ui.addNotification(
      'HarpyNet',
      E('p', {}, 'Подписка успешно обновлена'),
      'info',
    );
  } catch (_error) {
    ui.addNotification(
      'Ошибка HarpyNet',
      E('p', {}, 'Не удалось обновить подписку. Проверьте подключение и логи.'),
      'error',
    );
  } finally {
    const next = store.get().sectionsWidget;
    const updating = { ...next.subscriptionUpdatingSections };
    delete updating[sectionName];
    store.set({
      sectionsWidget: {
        ...next,
        subscriptionUpdatingSections: updating,
      },
    });
  }
}

// Renderer

async function renderSectionsWidget() {
  logger.debug('[DASHBOARD]', 'renderSectionsWidget');
  const sectionsWidget = store.get().sectionsWidget;
  const container = document.getElementById('dashboard-sections-grid');

  if (sectionsWidget.loading || sectionsWidget.failed) {
    const renderedWidget = renderSections({
      loading: sectionsWidget.loading,
      failed: sectionsWidget.failed,
      section: {
        code: '',
        sectionName: '',
        displayName: '',
        outbounds: [],
        withTagSelect: false,
      },
      onTestLatency: () => {},
      onChooseOutbound: () => {},
      onUpdateSubscription: async () => {},
      latencyFetching: false,
      subscriptionUpdating: false,
      selectorSwitchingTag: undefined,
    });

    return preserveScrollForPage(() => {
      container!.replaceChildren(renderedWidget);
    });
  }

  const renderedWidgets = sectionsWidget.data.map((section) =>
    renderSections({
      loading: sectionsWidget.loading,
      failed: sectionsWidget.failed,
      section,
      latencyFetching: Boolean(
        sectionsWidget.latencyFetchingSections[section.sectionName],
      ),
      subscriptionUpdating: Boolean(
        sectionsWidget.subscriptionUpdatingSections[section.sectionName],
      ),
      selectorSwitchingTag:
        sectionsWidget.selectorSwitchingSections[section.sectionName],
      onTestLatency: (tag) => {
        if (section.withTagSelect) {
          return handleTestGroupLatency(section.sectionName, tag);
        }

        return handleTestProxyLatency(section.sectionName, tag);
      },
      onChooseOutbound: (sectionName, selector, tag) => {
        void handleChooseOutbound(sectionName, selector, tag);
      },
      onUpdateSubscription: (targetSection) => {
        return handleUpdateSubscription(targetSection.sectionName);
      },
    }),
  );

  return preserveScrollForPage(() => {
    container!.replaceChildren(...renderedWidgets);
  });
}

async function renderBandwidthWidget() {
  logger.debug('[DASHBOARD]', 'renderBandwidthWidget');
  const traffic = store.get().bandwidthWidget;

  const container = document.getElementById('dashboard-widget-traffic');

  if (traffic.loading || traffic.failed) {
    const renderedWidget = renderWidget({
      loading: traffic.loading,
      failed: traffic.failed,
      title: '',
      items: [],
    });

    return container!.replaceChildren(renderedWidget);
  }

  const renderedWidget = renderWidget({
    loading: traffic.loading,
    failed: traffic.failed,
    title: _('Traffic'),
    items: [
      { key: _('Uplink'), value: formatBitrate(traffic.data.up) },
      { key: _('Downlink'), value: formatBitrate(traffic.data.down) },
    ],
  });

  container!.replaceChildren(renderedWidget);
}

function formatBitrate(bytesPerSecond: number) {
  const bitsPerSecond = Math.max(0, Number(bytesPerSecond) || 0) * 8;
  const units = [
    { threshold: 1e9, divisor: 1e9, suffix: 'Гбит/с' },
    { threshold: 1e6, divisor: 1e6, suffix: 'Мбит/с' },
    { threshold: 1e3, divisor: 1e3, suffix: 'Кбит/с' },
  ];
  const unit = units.find(({ threshold }) => bitsPerSecond >= threshold);

  if (!unit) {
    return `${Math.round(bitsPerSecond)} бит/с`;
  }

  return `${Number((bitsPerSecond / unit.divisor).toPrecision(3))} ${unit.suffix}`;
}

async function renderTrafficTotalWidget() {
  logger.debug('[DASHBOARD]', 'renderTrafficTotalWidget');
  const trafficTotalWidget = store.get().trafficTotalWidget;

  const container = document.getElementById('dashboard-widget-traffic-total');

  if (trafficTotalWidget.loading || trafficTotalWidget.failed) {
    const renderedWidget = renderWidget({
      loading: trafficTotalWidget.loading,
      failed: trafficTotalWidget.failed,
      title: '',
      items: [],
    });

    return container!.replaceChildren(renderedWidget);
  }

  const renderedWidget = renderWidget({
    loading: trafficTotalWidget.loading,
    failed: trafficTotalWidget.failed,
    title: _('Traffic Total'),
    items: [
      {
        key: _('Uplink'),
        value: String(prettyBytes(trafficTotalWidget.data.uploadTotal)),
      },
      {
        key: _('Downlink'),
        value: String(prettyBytes(trafficTotalWidget.data.downloadTotal)),
      },
    ],
  });

  container!.replaceChildren(renderedWidget);
}

async function renderSystemInfoWidget() {
  logger.debug('[DASHBOARD]', 'renderSystemInfoWidget');
  const systemInfoWidget = store.get().systemInfoWidget;

  const container = document.getElementById('dashboard-widget-system-info');

  if (systemInfoWidget.loading || systemInfoWidget.failed) {
    const renderedWidget = renderWidget({
      loading: systemInfoWidget.loading,
      failed: systemInfoWidget.failed,
      title: '',
      items: [],
    });

    return container!.replaceChildren(renderedWidget);
  }

  const renderedWidget = renderWidget({
    loading: systemInfoWidget.loading,
    failed: systemInfoWidget.failed,
    title: _('System info'),
    items: [
      {
        key: _('Active Connections'),
        value: String(systemInfoWidget.data.connections),
      },
      {
        key: _('Memory Usage'),
        value: String(prettyBytes(systemInfoWidget.data.memory)),
      },
    ],
  });

  container!.replaceChildren(renderedWidget);
}

async function renderServicesInfoWidget() {
  logger.debug('[DASHBOARD]', 'renderServicesInfoWidget');
  const servicesInfoWidget = store.get().servicesInfoWidget;

  const container = document.getElementById('dashboard-widget-service-info');

  if (servicesInfoWidget.loading || servicesInfoWidget.failed) {
    const renderedWidget = renderWidget({
      loading: servicesInfoWidget.loading,
      failed: servicesInfoWidget.failed,
      title: '',
      items: [],
    });

    return container!.replaceChildren(renderedWidget);
  }

  const renderedWidget = renderWidget({
    loading: servicesInfoWidget.loading,
    failed: servicesInfoWidget.failed,
    title: _('Services info'),
    items: [
      {
        key: _('HarpyNet'),
        value: servicesInfoWidget.data.harpynet
          ? _('✔ Enabled')
          : _('✘ Disabled'),
        attributes: {
          class: servicesInfoWidget.data.harpynet
            ? 'pdk_dashboard-page__widgets-section__item__row--success'
            : 'pdk_dashboard-page__widgets-section__item__row--error',
        },
      },
      {
        key: _('Sing-box'),
        value: servicesInfoWidget.data.singbox
          ? _('✔ Running')
          : _('✘ Stopped'),
        attributes: {
          class: servicesInfoWidget.data.singbox
            ? 'pdk_dashboard-page__widgets-section__item__row--success'
            : 'pdk_dashboard-page__widgets-section__item__row--error',
        },
      },
    ],
  });

  container!.replaceChildren(renderedWidget);
}

async function onStoreUpdate(
  next: StoreType,
  prev: StoreType,
  diff: Partial<StoreType>,
) {
  if (diff.sectionsWidget) {
    renderSectionsWidget();
  }

  if (diff.bandwidthWidget) {
    renderBandwidthWidget();
  }

  if (diff.trafficTotalWidget) {
    renderTrafficTotalWidget();
  }

  if (diff.systemInfoWidget) {
    renderSystemInfoWidget();
  }

  if (diff.servicesInfoWidget) {
    renderServicesInfoWidget();
  }
}

async function onPageMount() {
  // Cleanup before mount
  onPageUnmount();

  // Add new listener
  store.subscribe(onStoreUpdate);

  // Initial sections fetch
  await fetchDashboardSections();
  await fetchServicesInfo();
  await connectToClashSockets();
  sectionsRefreshTimer = setInterval(() => {
    void fetchDashboardSections();
  }, SECTIONS_REFRESH_INTERVAL_MS);
}

function onPageUnmount() {
  if (sectionsRefreshTimer) {
    clearInterval(sectionsRefreshTimer);
    sectionsRefreshTimer = null;
  }
  // Remove old listener
  store.unsubscribe(onStoreUpdate);
  // Clear store
  store.reset([
    'bandwidthWidget',
    'trafficTotalWidget',
    'systemInfoWidget',
    'servicesInfoWidget',
    'sectionsWidget',
  ]);
  socket.resetAll();
}

function registerLifecycleListeners() {
  store.subscribe((next, prev, diff) => {
    if (
      diff.tabService &&
      next.tabService.current !== prev.tabService.current
    ) {
      logger.debug(
        '[DASHBOARD]',
        'active tab diff event, active tab:',
        diff.tabService.current,
      );
      const isDashboardVisible = next.tabService.current === 'dashboard';

      if (isDashboardVisible) {
        logger.debug(
          '[DASHBOARD]',
          'registerLifecycleListeners',
          'onPageMount',
        );
        return onPageMount();
      }

      if (!isDashboardVisible) {
        logger.debug(
          '[DASHBOARD]',
          'registerLifecycleListeners',
          'onPageUnmount',
        );
        return onPageUnmount();
      }
    }
  });
}

export async function initController(): Promise<void> {
  onMount('dashboard-status').then(() => {
    logger.debug('[DASHBOARD]', 'initController', 'onMount');
    onPageMount();
    registerLifecycleListeners();
  });
}
