import { logsTranslate as t } from './i18n';

export function render() {
  return E('div', { id: 'logs-status', class: 'pdk_logs-page' }, [
    E('div', { class: 'pdk_logs-page__panel' }, [
      E('div', { class: 'pdk_logs-page__controls' }, [
        E('div', { class: 'pdk_logs-page__tabs' }, [
          E(
            'button',
            {
              id: 'logs-tab-active',
              class: 'btn cbi-button pdk_logs-page__tab pdk_logs-page__tab--active',
              type: 'button',
            },
            `${t('Active', 'РђРєС‚РёРІРЅС‹Рµ')} 0`,
          ),
          E(
            'button',
            {
              id: 'logs-tab-proxy',
              class: 'btn cbi-button pdk_logs-page__tab',
              type: 'button',
            },
            `${t('Proxy', 'Прокси')} 0`,
          ),
          E(
            'button',
            {
              id: 'logs-tab-fullvpn',
              class: 'btn cbi-button pdk_logs-page__tab',
              type: 'button',
              title: t('Device traffic in Full VPN mode', 'Трафик устройств в режиме Полный VPN'),
            },
            `${t('Full VPN', 'Полный VPN')} 0`,
          ),
          E(
            'button',
            {
              id: 'logs-tab-direct',
              class: 'btn cbi-button pdk_logs-page__tab',
              type: 'button',
            },
            `${t('Without VPN', 'Без VPN')} 0`,
          ),
          E(
            'button',
            {
              id: 'logs-tab-failure',
              class: 'btn cbi-button pdk_logs-page__tab',
              type: 'button',
              title: t('Failure candidates', 'Кандидаты для сбоя'),
            },
            `${t('Failure', 'Сбой')} 0`,
          ),
          E(
            'button',
            {
              id: 'logs-tab-closed',
              class: 'btn cbi-button pdk_logs-page__tab',
              type: 'button',
            },
            `${t('Closed', 'Р—Р°РєСЂС‹С‚С‹Рµ')} 0`,
          ),
        ]),
        E('label', { class: 'pdk_logs-page__search' }, [
          E('span', { class: 'pdk_logs-page__search-icon' }, []),
          E('input', {
            id: 'logs-search',
            class: 'cbi-input-text pdk_logs-page__search-input',
            type: 'search',
            placeholder: t('Search', 'РџРѕРёСЃРє'),
            autocomplete: 'off',
          }),
        ]),
        E('div', { class: 'pdk_logs-page__actions' }, [
          E(
            'button',
            {
              id: 'logs-source-toggle',
              class: 'btn cbi-button pdk_logs-page__source-toggle',
              title: t('Show device names', 'Показать имена устройств'),
              'aria-label': t('Show device names', 'Показать имена устройств'),
              type: 'button',
            },
            'IP',
          ),
          E(
            'button',
            {
              id: 'logs-close-all',
              class: 'btn cbi-button pdk_logs-page__icon-button',
              title: t('Close all connections', 'Р—Р°РєСЂС‹С‚СЊ РІСЃРµ СЃРѕРµРґРёРЅРµРЅРёСЏ'),
              'aria-label': t(
                'Close all connections',
                'Р—Р°РєСЂС‹С‚СЊ РІСЃРµ СЃРѕРµРґРёРЅРµРЅРёСЏ',
              ),
              type: 'button',
              disabled: true,
            },
            [],
          ),
          E(
            'button',
            {
              id: 'logs-pause-toggle',
              class: 'btn cbi-button pdk_logs-page__icon-button',
              title: t('Pause updates', 'РџР°СѓР·Р° РѕР±РЅРѕРІР»РµРЅРёР№'),
              'aria-label': t('Pause updates', 'РџР°СѓР·Р° РѕР±РЅРѕРІР»РµРЅРёР№'),
              type: 'button',
            },
            [],
          ),
        ]),
      ]),
      E('div', { id: 'logs-connections', class: 'pdk_logs-page__body' }, [
        E(
          'div',
          { class: 'pdk_logs-page__state pdk_logs-page__state--loading' },
          t('Loading connections', 'Р—Р°РіСЂСѓР·РєР° СЃРѕРµРґРёРЅРµРЅРёР№'),
        ),
      ]),
    ]),
  ]);
}
