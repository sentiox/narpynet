import { normalizeCompiledVersion } from '../../../../helpers/normalizeCompiledVersion';
import { removeVersionPrefix } from '../../../../helpers/removeVersionPrefix';
import type { StoreType } from '../../../services/store.service';
import type { IRenderSystemInfoRow } from '../partials';

function isUnknownVersion(version?: string | null): boolean {
  return version === 'unknown' || version === _('unknown');
}

export function getHarpyNetVersionRow(
  diagnosticsSystemInfo: StoreType['diagnosticsSystemInfo'],
): IRenderSystemInfoRow {
  const loading = diagnosticsSystemInfo.loading;
  const unknown = isUnknownVersion(diagnosticsSystemInfo.harpynet_version);
  const hasActualVersion =
    Boolean(diagnosticsSystemInfo.harpynet_latest_version) &&
    !isUnknownVersion(diagnosticsSystemInfo.harpynet_latest_version);
  const version = normalizeCompiledVersion(
    diagnosticsSystemInfo.harpynet_version,
  );
  const isDevVersion = version === 'dev';

  if (loading || unknown || !hasActualVersion || isDevVersion) {
    return {
      key: 'HarpyNet',
      value: version,
    };
  }

  if (
    removeVersionPrefix(version) !==
    removeVersionPrefix(diagnosticsSystemInfo.harpynet_latest_version)
  ) {
    return {
      key: 'HarpyNet',
      value: version,
      tag: {
        label: _('Outdated'),
        kind: 'warning',
      },
    };
  }

  return {
    key: 'HarpyNet',
    value: version,
    tag: {
      label: _('Latest'),
      kind: 'success',
    },
  };
}
