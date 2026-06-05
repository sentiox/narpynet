import { describe, expect, it } from 'vitest';
import { getHarpyNetVersionRow } from '../helpers/getHarpyNetVersionRow';
import type { StoreType } from '../../../services/store.service';

function makeDiagnosticsSystemInfo(
  patch: Partial<StoreType['diagnosticsSystemInfo']> = {},
): StoreType['diagnosticsSystemInfo'] {
  return {
    loading: false,
    harpynet_version: '1.2.3',
    harpynet_latest_version: '1.2.3',
    luci_app_version: '1.0.0',
    sing_box_version: '1.11.0',
    openwrt_version: 'OpenWrt 25.12',
    device_model: 'Test Router',
    ...patch,
  };
}

describe('getHarpyNetVersionRow', () => {
  it('returns Latest when versions differ only by leading v', () => {
    const row = getHarpyNetVersionRow(
      makeDiagnosticsSystemInfo({
        harpynet_version: 'v1.2.3',
        harpynet_latest_version: '1.2.3',
      }),
    );

    expect(row).toEqual({
      key: 'HarpyNet',
      value: 'v1.2.3',
      tag: {
        label: 'Latest',
        kind: 'success',
      },
    });
  });

  it('returns Outdated when versions differ', () => {
    const row = getHarpyNetVersionRow(
      makeDiagnosticsSystemInfo({
        harpynet_version: '1.2.2',
        harpynet_latest_version: '1.2.3',
      }),
    );

    expect(row).toEqual({
      key: 'HarpyNet',
      value: '1.2.2',
      tag: {
        label: 'Outdated',
        kind: 'warning',
      },
    });
  });

  it('returns plain row without tag for dev build', () => {
    const row = getHarpyNetVersionRow(
      makeDiagnosticsSystemInfo({
        harpynet_version: 'COMPILED_VERSION',
      }),
    );

    expect(row).toEqual({
      key: 'HarpyNet',
      value: 'dev',
    });
  });
});
