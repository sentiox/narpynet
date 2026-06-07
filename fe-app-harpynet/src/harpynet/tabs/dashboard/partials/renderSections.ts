import {
  renderHeadphonesIcon24,
  renderLinkIcon24,
  renderLoaderCircleIcon24,
  renderRotateCcwIcon24,
} from '../../../../icons';
import {
  renderCountryFlag,
  stripCountryPrefix,
  svgEl,
} from '../../../../helpers';
import { prettyBytes } from '../../../../helpers/prettyBytes';
import { HarpyNet } from '../../../types';

interface IRenderSectionsProps {
  loading: boolean;
  failed: boolean;
  section: HarpyNet.OutboundGroup;
  onTestLatency: (tag: string) => void;
  onChooseOutbound: (
    sectionName: string,
    selector: string,
    tag: string,
  ) => void;
  onUpdateSubscription: (section: HarpyNet.OutboundGroup) => Promise<void>;
  latencyFetching: boolean;
  subscriptionUpdating: boolean;
  selectorSwitchingTag?: string;
}

function t(english: string, russian: string) {
  const language = `${document.documentElement.lang || ''}`.toLowerCase();
  return language.startsWith('ru') ? russian : _(english);
}

function renderFailedState() {
  return E(
    'div',
    {
      class: 'pdk_dashboard-page__outbound-section centered',
      style: 'height: 127px',
    },
    t('Dashboard currently unavailable', 'Дашборд временно недоступен'),
  );
}

function renderLoadingState() {
  return E('div', {
    id: 'dashboard-sections-grid-skeleton',
    class: 'pdk_dashboard-page__outbound-section skeleton',
    style: 'height: 127px',
  });
}

function formatDate(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return undefined;
  return new Date(seconds * 1000).toLocaleDateString();
}

function formatDaysLeft(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return undefined;
  const days = Math.max(0, Math.ceil((seconds * 1000 - Date.now()) / 86400000));
  return t(`${days} days`, `${days} дн.`);
}

function renderMetadataAction(
  label: string,
  url?: string,
  icon: 'link' | 'support' = 'link',
) {
  if (!url || !/^https?:\/\/\S+$/i.test(url)) return undefined;

  return E(
    'a',
    {
      class: 'btn pdk_dashboard-page__subscription-meta__action',
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
      title: label,
    },
    icon === 'support' ? renderHeadphonesIcon24() : renderLinkIcon24(),
  );
}

function renderSubscriptionMetadata(metadata: HarpyNet.SubscriptionMetadata) {
  const traffic = metadata.traffic;
  const used = prettyBytes(traffic?.used || 0);
  const total = traffic?.isUnlimited ? '∞' : prettyBytes(traffic?.total || 0);
  const expire = formatDate(metadata.expire);
  const daysLeft = formatDaysLeft(metadata.expire);
  const refill = formatDate(metadata.refillDate);
  const rows = [
    traffic
      ? { label: t('Traffic', 'Трафик'), value: `${used} / ${total}` }
      : undefined,
    expire
      ? {
          label: t('Expires', 'Истекает'),
          value: daysLeft ? `${expire} (${daysLeft})` : expire,
        }
      : undefined,
    refill
      ? { label: t('Refill', 'Обновление'), value: refill }
      : undefined,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const actions = [
    renderMetadataAction(t('Profile', 'Профиль'), metadata.webPageUrl),
    renderMetadataAction(
      t('Support', 'Поддержка'),
      metadata.supportUrl,
      'support',
    ),
    renderMetadataAction(t('Details', 'Подробнее'), metadata.announceUrl),
  ].filter(Boolean) as HTMLElement[];

  return E('div', { class: 'pdk_dashboard-page__subscription-meta' }, [
    E('div', { class: 'pdk_dashboard-page__subscription-meta__main' }, [
      E(
        'div',
        { class: 'pdk_dashboard-page__subscription-meta__heading' },
        t('Subscription:', 'Подписка:'),
      ),
      metadata.title
        ? E(
            'div',
            { class: 'pdk_dashboard-page__subscription-meta__title' },
            metadata.title,
          )
        : '',
      E(
        'div',
        { class: 'pdk_dashboard-page__subscription-meta__facts' },
        rows.map((row) =>
          E('div', { class: 'pdk_dashboard-page__subscription-meta__fact' }, [
            E(
              'span',
              { class: 'pdk_dashboard-page__subscription-meta__fact-key' },
              row.label,
            ),
            E(
              'span',
              { class: 'pdk_dashboard-page__subscription-meta__fact-value' },
              row.value,
            ),
          ]),
        ),
      ),
      actions.length
        ? E(
            'div',
            { class: 'pdk_dashboard-page__subscription-meta__actions' },
            actions,
          )
        : '',
    ]),
    metadata.announce
      ? E(
          'blockquote',
          { class: 'pdk_dashboard-page__subscription-meta__announce' },
          metadata.announce,
        )
      : '',
  ]);
}

function renderDefaultState(props: IRenderSectionsProps) {
  const {
    section,
    latencyFetching,
    subscriptionUpdating,
    selectorSwitchingTag,
  } = props;

  function renderOutbound(outbound: HarpyNet.Outbound) {
    const canChoose =
      section.withTagSelect &&
      !selectorSwitchingTag &&
      !outbound.selected;
    const switching = selectorSwitchingTag === outbound.code;
    const latencyClass = !outbound.latency
      ? 'pdk_dashboard-page__outbound-grid__item__latency--empty'
      : outbound.latency < 800
        ? 'pdk_dashboard-page__outbound-grid__item__latency--green'
        : outbound.latency < 1500
          ? 'pdk_dashboard-page__outbound-grid__item__latency--yellow'
          : 'pdk_dashboard-page__outbound-grid__item__latency--red';
    const flag = renderCountryFlag(outbound.country, outbound.displayName);
    const displayName = stripCountryPrefix(outbound.displayName, outbound.country);

    return E(
      'div',
      {
        class: [
          'pdk_dashboard-page__outbound-grid__item',
          outbound.selected
            ? 'pdk_dashboard-page__outbound-grid__item--active'
            : '',
          canChoose
            ? 'pdk_dashboard-page__outbound-grid__item--selectable'
            : '',
          switching
            ? 'pdk_dashboard-page__outbound-grid__item--switching'
            : '',
        ]
          .filter(Boolean)
          .join(' '),
        click: () =>
          canChoose &&
          props.onChooseOutbound(
            section.sectionName,
            section.code,
            outbound.code,
          ),
      },
      [
        ...(switching
          ? [
              svgEl(
                'svg',
                { class: 'pdk_dashboard-page__outbound-grid__item__snake' },
                [
                  svgEl('rect', {
                    width: '100%',
                    height: '100%',
                    fill: 'none',
                    rx: 4,
                    ry: 4,
                    pathLength: 100,
                  }),
                ],
              ),
            ]
          : []),
        E('div', { class: 'pdk_dashboard-page__outbound-grid__item__header' }, [
          E('b', {}, [flag, E('span', {}, displayName)].filter(Boolean)),
        ]),
        E('div', { class: 'pdk_dashboard-page__outbound-grid__item__footer' }, [
          E(
            'div',
            { class: 'pdk_dashboard-page__outbound-grid__item__type' },
            outbound.type,
          ),
          E(
            'div',
            { class: latencyClass },
            outbound.latency ? `${outbound.latency}ms` : 'N/A',
          ),
        ]),
      ],
    );
  }

  const metadataNodes = (section.subscriptionMetadata || []).map(
    renderSubscriptionMetadata,
  );

  return E('div', { class: 'pdk_dashboard-page__outbound-section' }, [
    E('div', { class: 'pdk_dashboard-page__outbound-section__title-section' }, [
      E(
        'div',
        {
          class: 'pdk_dashboard-page__outbound-section__title-section__title',
        },
        section.displayName,
      ),
      E(
        'div',
        {
          class: 'pdk_dashboard-page__outbound-section__title-section__actions',
        },
        [
          section.subscriptionSourceCount
            ? E(
                'button',
                {
                  type: 'button',
                  class:
                    'btn pdk_dashboard-page__outbound-section__subscription-update',
                  title: t('Update subscription', 'Обновить подписку'),
                  disabled: subscriptionUpdating ? true : undefined,
                  click: async (event: MouseEvent) => {
                    event.stopPropagation();
                    if (!subscriptionUpdating) {
                      const button = event.currentTarget as HTMLButtonElement;
                      button.disabled = true;
                      button.replaceChildren(renderLoaderCircleIcon24());
                      await props.onUpdateSubscription(section);
                    }
                  },
                },
                subscriptionUpdating
                  ? renderLoaderCircleIcon24()
                  : renderRotateCcwIcon24(),
              )
            : '',
          E(
            'button',
            {
              type: 'button',
              class: 'btn dashboard-sections-grid-item-test-latency',
              disabled: latencyFetching ? true : undefined,
              click: () =>
                !latencyFetching &&
                props.onTestLatency(section.latencyTestCode || section.code),
            },
            latencyFetching
              ? [renderLoaderCircleIcon24(), t('Testing', 'Проверка')]
              : t('Test latency', 'Проверить пинг'),
          ),
        ],
      ),
    ]),
    E('div', { class: 'pdk_dashboard-page__outbound-grid' }, [
      ...metadataNodes,
      ...section.outbounds.map(renderOutbound),
    ]),
  ]);
}

export function renderSections(props: IRenderSectionsProps) {
  if (props.failed) return renderFailedState();
  if (props.loading) return renderLoadingState();
  return renderDefaultState(props);
}
