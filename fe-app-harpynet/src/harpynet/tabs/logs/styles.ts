// language=CSS
export const styles = `
#cbi-harpynet-logs-_mount_node {
    display: block;
    width: 100%;
    margin: 0;
}

#cbi-harpynet-logs-_mount_node > .cbi-value-title {
    display: none;
}

#cbi-harpynet-logs-_mount_node > .cbi-value-field {
    float: none;
    width: 100% !important;
    max-width: none;
    margin: 0;
}

#cbi-harpynet-logs > h3 {
    display: none;
}

.pdk_logs-page {
    --pdk-logs-control-height: 34px;
    --pdk-logs-divider-color: rgba(127, 127, 127, 0.22);
    --pdk-logs-soft-bg: rgba(127, 127, 127, 0.08);
    --pdk-logs-soft-bg-hover: rgba(127, 127, 127, 0.14);
    --pdk-logs-danger-color: var(--error-color-medium, #d32f2f);
    --pdk-logs-success-color: var(--success-color-medium, #2e7d32);
    --pdk-logs-paused-color: var(--primary-color-high, #1976d2);
    width: 100%;
    box-sizing: border-box;
}

.pdk_logs-page__panel {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--pdk-logs-divider-color);
    padding: 10px;
}

.pdk_logs-page__controls {
    display: grid;
    grid-template-columns: auto minmax(220px, 1fr) auto;
    gap: 10px;
    align-items: center;
    margin-bottom: 12px;
}

.pdk_logs-page__tabs {
    display: inline-flex;
    gap: 4px;
    padding: 3px;
    border: 1px solid var(--pdk-logs-divider-color);
    background: var(--pdk-logs-soft-bg);
    max-width: 100%;
    overflow-x: auto;
}

.pdk_logs-page .btn.pdk_logs-page__tab {
    height: calc(var(--pdk-logs-control-height) - 6px);
    min-height: calc(var(--pdk-logs-control-height) - 6px);
    border: 0 !important;
    background: transparent !important;
}

.pdk_logs-page .btn.pdk_logs-page__tab--active {
    color: var(--primary-color-high, #1976d2) !important;
    background: var(--pdk-logs-soft-bg-hover) !important;
}

.pdk_logs-page__search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--pdk-logs-control-height);
    border: 1px solid var(--pdk-logs-divider-color);
    padding: 0 10px;
}

.pdk_logs-page__search-icon {
    width: 18px;
    height: 18px;
    opacity: 0.65;
}

.pdk_logs-page__search-icon svg {
    width: 18px;
    height: 18px;
}

.pdk_logs-page__search-input {
    width: 100% !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
}

.pdk_logs-page__actions {
    display: inline-flex;
    gap: 8px;
    justify-content: flex-end;
}

.pdk_logs-page .btn.pdk_logs-page__icon-button,
.pdk_logs-page .btn.pdk_logs-page__row-action,
.pdk_logs-page .btn.pdk_logs-page__source-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--pdk-logs-control-height);
    height: var(--pdk-logs-control-height);
    min-width: var(--pdk-logs-control-height);
    padding: 0 !important;
}

.pdk_logs-page .btn.pdk_logs-page__row-action {
    width: 26px;
    height: 26px;
    min-width: 26px;
    min-height: 26px;
}

.pdk_logs-page #logs-close-all,
.pdk_logs-page__row-action {
    border-color: var(--pdk-logs-danger-color) !important;
    color: var(--pdk-logs-danger-color) !important;
}

.pdk_logs-page #logs-pause-toggle {
    border-color: var(--pdk-logs-success-color) !important;
    color: var(--pdk-logs-success-color) !important;
}

.pdk_logs-page #logs-pause-toggle.pdk_logs-page__icon-button--active {
    border-color: var(--pdk-logs-paused-color) !important;
    color: var(--pdk-logs-paused-color) !important;
}

.pdk_logs-page .btn.pdk_logs-page__source-toggle {
    width: 46px;
    min-width: 46px;
    font-weight: 700;
}

.pdk_logs-page .btn.pdk_logs-page__source-toggle--active {
    border-color: var(--pdk-logs-paused-color) !important;
    color: var(--pdk-logs-paused-color) !important;
}

.pdk_logs-page__icon-button svg,
.pdk_logs-page__row-action svg {
    width: 18px;
    height: 18px;
}

.pdk_logs-page__row-action svg {
    width: 14px;
    height: 14px;
}

.pdk_logs-page__table-wrap {
    overflow-x: auto;
    width: 100%;
}

.pdk_logs-page__table {
    width: 100%;
    min-width: 720px;
    table-layout: fixed;
}

.pdk_logs-page__table th,
.pdk_logs-page__table td {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
    text-align: center;
}

.pdk_logs-page__table th:first-child,
.pdk_logs-page__table td:first-child {
    text-align: left;
    width: 20%;
}

.pdk_logs-page__table th:nth-child(2),
.pdk_logs-page__table td:nth-child(2) {
    width: 48px;
}

.pdk_logs-page__table th:nth-child(3),
.pdk_logs-page__table td:nth-child(3) {
    width: 118px;
}

.pdk_logs-page__table th:nth-child(4),
.pdk_logs-page__table td:nth-child(4) {
    width: 70px;
}

.pdk_logs-page__table th:nth-child(5),
.pdk_logs-page__table td:nth-child(5),
.pdk_logs-page__table th:nth-child(6),
.pdk_logs-page__table td:nth-child(6) {
    width: 86px;
}

.pdk_logs-page__table th:nth-child(7),
.pdk_logs-page__table td:nth-child(7) {
    width: 170px;
    text-align: left;
}

.pdk_logs-page__table th:nth-child(8),
.pdk_logs-page__table td:nth-child(8) {
    width: 108px;
}

.pdk_logs-page__table th:nth-child(9),
.pdk_logs-page__table td:nth-child(9) {
    width: 44px;
}

.pdk_logs-page__route {
    font-weight: 700;
}

.harpynet-route-fullvpn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    white-space: nowrap;
}

.harpynet-route-fullvpn__label {
    color: var(--success-color-medium, #00a86b);
    font-size: 13px;
    font-weight: 800;
}

.pdk_logs-page__host-cell {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.pdk_logs-page__host-value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pdk_logs-page .btn.pdk_logs-page__copy-host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    min-width: 24px;
    padding: 0 !important;
    opacity: 0.7;
}

.pdk_logs-page .btn.pdk_logs-page__copy-host:hover {
    opacity: 1;
}

.pdk_logs-page__copy-host svg {
    width: 14px;
    height: 14px;
}

.pdk_logs-page__service-cell {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 170px;
    line-height: 1.32;
    text-align: left;
    align-items: flex-start;
}

.pdk_logs-page__service-name,
.pdk_logs-page__service-reason {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pdk_logs-page__service-name {
    color: var(--pdk-logs-success-color);
    font-size: 13px;
    font-weight: 700;
}

.pdk_logs-page__service-reason {
    color: var(--text-color-medium, #aeb7c2);
    font-size: 12px;
    font-weight: 500;
    max-width: 100%;
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.pdk_logs-page__service-cell--failed .pdk_logs-page__service-name,
.pdk_logs-page__service-cell--failed .pdk_logs-page__service-reason {
    color: var(--pdk-logs-danger-color);
    font-weight: 700;
}

.harpynet-route-direct {
    color: var(--warning-color-medium, #b8860b);
    font-weight: 700;
}

.harpynet-route-with-flag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
}

.pdk_logs-page__action-cell {
    text-align: center;
    padding-top: 4px !important;
    padding-bottom: 3px !important;
}

.pdk_logs-page__state {
    padding: 34px 12px;
    text-align: center;
    opacity: 0.72;
}

.pdk_logs-page__state--error {
    color: var(--error-color-medium, #d32f2f);
}

@media (max-width: 820px) {
    .pdk_logs-page__controls {
        grid-template-columns: 1fr auto;
        gap: 8px;
    }

    .pdk_logs-page__tabs {
        grid-column: 1 / -1;
        width: 100%;
        box-sizing: border-box;
    }

    .pdk_logs-page__search {
        min-width: 0;
    }

    .pdk_logs-page__actions {
        justify-content: flex-end;
    }
}

@media (max-width: 820px) {
    .pdk_logs-page__panel {
        padding: 8px;
    }

    .pdk_logs-page__controls {
        grid-template-columns: 1fr;
    }

    .pdk_logs-page__tabs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        overflow: visible;
    }

    .pdk_logs-page .btn.pdk_logs-page__tab {
        width: 100%;
        min-width: 0;
        padding-right: 6px !important;
        padding-left: 6px !important;
        white-space: nowrap;
    }

    .pdk_logs-page__actions {
        width: 100%;
    }

    .pdk_logs-page .btn.pdk_logs-page__source-toggle {
        margin-left: auto;
    }

    .pdk_logs-page__table-wrap {
        overflow-x: visible;
    }

    .pdk_logs-page__table {
        min-width: 0;
        table-layout: auto;
    }

    .pdk_logs-page__table thead {
        display: none;
    }

    .pdk_logs-page__table,
    .pdk_logs-page__table tbody,
    .pdk_logs-page__table tr,
    .pdk_logs-page__table td {
        display: block;
        width: 100% !important;
        box-sizing: border-box;
    }

    .pdk_logs-page__table tr {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px 10px;
        padding: 10px;
        border: 1px solid var(--pdk-logs-divider-color);
        background: var(--pdk-logs-soft-bg);
        margin-bottom: 8px;
    }

    .pdk_logs-page__table td {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-width: 0;
        border: 0 !important;
        padding: 0 !important;
        text-align: right;
        white-space: nowrap;
        overflow: visible;
    }

    .pdk_logs-page__table td::before {
        content: attr(data-label);
        flex: 0 0 auto;
        max-width: 45%;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text-color-medium, #888);
        font-size: 12px;
        font-weight: 700;
        text-align: left;
    }

    .pdk_logs-page__table td:first-child,
    .pdk_logs-page__table td:nth-child(2),
    .pdk_logs-page__table td:nth-child(3),
    .pdk_logs-page__table td:nth-child(4),
    .pdk_logs-page__table td:nth-child(5),
    .pdk_logs-page__table td:nth-child(6),
    .pdk_logs-page__table td:nth-child(7),
    .pdk_logs-page__table td:nth-child(8),
    .pdk_logs-page__table td:nth-child(9) {
        grid-column: 1 / -1;
    }

    .pdk_logs-page__table td:first-child,
    .pdk_logs-page__table td:first-child::before {
        text-align: left;
    }

    .pdk_logs-page__host-cell {
        justify-content: space-between;
    }

    .pdk_logs-page__service-cell {
        max-width: 100%;
        align-items: flex-end;
        text-align: right;
    }

    .pdk_logs-page__host-value {
        text-align: right;
    }

    .pdk_logs-page__table td > *:last-child {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .pdk_logs-page__route > *:last-child,
    .pdk_logs-page__table td:nth-child(7) {
        overflow: visible;
        text-overflow: clip;
    }

    .pdk_logs-page__action-cell {
        justify-content: flex-end !important;
        padding-top: 2px !important;
    }

    .pdk_logs-page__action-cell::before {
        display: none;
    }

    .pdk_logs-page__action-cell .pdk_logs-page__row-action {
        margin-left: auto;
    }
}
`;
