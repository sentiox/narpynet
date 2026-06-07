import { getConfigSections } from './getConfigSections';
import { HarpyNet } from '../../types';
import { getProxyUrlName } from '../../../helpers';
import { HarpyNetShellMethods } from '../shell';

interface IGetDashboardSectionsResponse {
  success: boolean;
  data: HarpyNet.OutboundGroup[];
}

async function readSubscriptionLinkCache(sectionName: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(sectionName)) {
    return new Map<string, string>();
  }

  const cache = await HarpyNetShellMethods.getSubscriptionCache(sectionName);

  if (cache.success && cache.data && typeof cache.data === 'object') {
    return new Map(
      Object.entries(cache.data).filter(
        ([code, link]) => Boolean(code && link) && typeof link === 'string',
      ) as Array<[string, string]>,
    );
  }

  return new Map<string, string>();
}

async function readSubscriptionMetadata(sectionName: string) {
  const response =
    await HarpyNetShellMethods.getSubscriptionMetadata(sectionName);

  if (
    response.success &&
    response.data &&
    typeof response.data === 'object' &&
    Object.keys(response.data).length > 1
  ) {
    return [response.data];
  }

  return undefined;
}

function getCachedProxyName(link: string) {
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

function inferCountryCode(displayName: string) {
  const value = displayName.toLowerCase();
  const aliases: Array<[string, string]> = [
    ['япони', 'JP'],
    ['japan', 'JP'],
    ['эстони', 'EE'],
    ['estonia', 'EE'],
    ['швец', 'SE'],
    ['sweden', 'SE'],
    ['сингапур', 'SG'],
    ['singapore', 'SG'],
    ['британи', 'GB'],
    ['united kingdom', 'GB'],
    ['germany', 'DE'],
    ['германи', 'DE'],
    ['нидерланд', 'NL'],
    ['netherlands', 'NL'],
    ['финлян', 'FI'],
    ['finland', 'FI'],
    ['франц', 'FR'],
    ['france', 'FR'],
    ['сша', 'US'],
    ['united states', 'US'],
    ['usa', 'US'],
    ['канад', 'CA'],
    ['canada', 'CA'],
    ['польш', 'PL'],
    ['poland', 'PL'],
  ];

  return aliases.find(([alias]) => value.includes(alias))?.[1];
}

export async function getDashboardSections(): Promise<IGetDashboardSectionsResponse> {
  const configSections = await getConfigSections();
  const clashProxies = await HarpyNetShellMethods.getClashApiProxies();

  if (!clashProxies.success) {
    return {
      success: false,
      data: [],
    };
  }

  const proxies = Object.entries(clashProxies.data.proxies).map(
    ([key, value]) => ({
      code: key,
      value,
    }),
  );

  const data = configSections
    .filter(
      (section) =>
        section.connection_type !== 'exclusion' &&
        section['.type'] !== 'settings',
    )
    .map(async (section) => {
      if (section.connection_type === 'proxy') {
        {
          const linkByCode = await readSubscriptionLinkCache(section['.name']);
          const subscriptionMetadata = await readSubscriptionMetadata(
            section['.name'],
          );
          const selector = proxies.find(
            (proxy) => proxy.code === `${section['.name']}-out`,
          );
          const urltest = proxies.find(
            (proxy) => proxy.code === `${section['.name']}-urltest-out`,
          );

          const outbounds = (selector?.value?.all ?? [])
            .map((code) => proxies.find((item) => item.code === code))
            .filter((item) => item?.code !== urltest?.code)
            .map((item) => {
              const link = linkByCode.get(item?.code || '') || '';
              const displayName =
                getCachedProxyName(link) ||
                getProxyUrlName(link) ||
                item?.value?.name ||
                item?.code ||
                '';

              return {
                code: item?.code || '',
                displayName,
                latency: item?.value?.history?.[0]?.delay || 0,
                type: item?.value?.type || '',
                selected: selector?.value?.now === item?.code,
                link,
                canCopyLink: Boolean(link),
                country: inferCountryCode(displayName),
              };
            });

          return {
            withTagSelect: true,
            code: selector?.code || section['.name'],
            sectionName: section['.name'],
            displayName: section['.name'],
            latencyTestCode: urltest?.code || selector?.code,
            subscriptionSourceCount: 1,
            subscriptionMetadata,
            outbounds: [
              ...(urltest
                ? [
                    {
                      code: urltest.code,
                      displayName: _('Fastest'),
                      latency: urltest.value?.history?.[0]?.delay || 0,
                      type: urltest.value?.type || '',
                      selected: selector?.value?.now === urltest.code,
                    },
                  ]
                : []),
              ...outbounds,
            ],
          };
        }

      }

      return {
        withTagSelect: false,
        code: section['.name'],
        sectionName: section['.name'],
        displayName: section['.name'],
        outbounds: [],
      };
    });

  return {
    success: true,
    data: await Promise.all(data),
  };
}
