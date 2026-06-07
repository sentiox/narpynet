// language=CSS
export const styles = `
#cbi-harpynet-dashboard-_mount_node {
    display: block;
    width: 100%;
    margin: 0;
}

#cbi-harpynet-dashboard-_mount_node > .cbi-value-title {
    display: none;
}

#cbi-harpynet-dashboard-_mount_node > .cbi-value-field {
    float: none;
    width: 100% !important;
    max-width: none;
    margin: 0;
}

#cbi-harpynet-dashboard > h3 {
    display: none;
}

.pdk_dashboard-page {
    width: 100%;
    box-sizing: border-box;
    --dashboard-grid-columns: 4;
    --dashboard-grid-min-width: 180px;
}

@media (max-width: 900px) {
    .pdk_dashboard-page {
        --dashboard-grid-columns: 2;
    }
}

@media (max-width: 560px) {
    .pdk_dashboard-page {
        --dashboard-grid-columns: 1;
        --dashboard-grid-min-width: 0;
    }
}

.pdk_dashboard-page__widgets-section {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(var(--dashboard-grid-columns), minmax(var(--dashboard-grid-min-width), 1fr));
    grid-gap: 10px;
}

.pdk_dashboard-page__widgets-section__item {
    border: 2px var(--background-color-low, lightgray) solid;
    border-radius: 4px;
    padding: 10px;
    min-width: 0;
}

.pdk_dashboard-page__widgets-section__item__title {}

.pdk_dashboard-page__widgets-section__item__row {}

.pdk_dashboard-page__widgets-section__item__row--success .pdk_dashboard-page__widgets-section__item__row__value {
    color: var(--success-color-medium, green);
}

.pdk_dashboard-page__widgets-section__item__row--error .pdk_dashboard-page__widgets-section__item__row__value {
    color: var(--error-color-medium, red);
}

.pdk_dashboard-page__widgets-section__item__row__key {}

.pdk_dashboard-page__widgets-section__item__row__value {}

.pdk_dashboard-page__outbound-section {
    margin-top: 10px;
    border: 2px var(--background-color-low, lightgray) solid;
    border-radius: 4px;
    padding: 10px;
}

.pdk_dashboard-page__outbound-section__title-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px 10px;
}

.pdk_dashboard-page__outbound-section__title-section__title {
    color: var(--text-color-high);
    font-weight: 700;
    min-width: 0;
    overflow-wrap: anywhere;
}

.pdk_dashboard-page__outbound-section__title-section__actions {
    display: flex;
    align-items: center;
    gap: 6px;
}

.pdk_dashboard-page .btn.pdk_dashboard-page__outbound-section__subscription-update {
    width: 28px;
    height: 28px;
    min-width: 28px;
    padding: 2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.pdk_dashboard-page .btn.dashboard-sections-grid-item-test-latency {
    min-width: 110px;
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.pdk_dashboard-page__outbound-section__subscription-update svg,
.pdk_dashboard-page .btn.dashboard-sections-grid-item-test-latency svg {
    width: 15px;
    height: 15px;
}

.pdk_dashboard-page__outbound-section__subscription-update:disabled svg {
    animation: pdk-subscription-update-spin 0.8s linear infinite !important;
}

@keyframes pdk-subscription-update-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.pdk_dashboard-page__outbound-grid {
    margin-top: 5px;
    display: grid;
    grid-template-columns: repeat(var(--dashboard-grid-columns), minmax(var(--dashboard-grid-min-width), 1fr));
    grid-gap: 10px;
}

.pdk_dashboard-page__subscription-meta {
    grid-column: 1 / -1;
    border: 2px var(--background-color-low, lightgray) solid;
    border-radius: 4px;
    padding: 8px 10px;
}

.pdk_dashboard-page__subscription-meta__main {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 10px;
}

.pdk_dashboard-page__subscription-meta__heading,
.pdk_dashboard-page__subscription-meta__title {
    color: var(--text-color-high);
    font-weight: 700;
}

.pdk_dashboard-page__subscription-meta__facts {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    gap: 5px 12px;
}

.pdk_dashboard-page__subscription-meta__fact {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.pdk_dashboard-page__subscription-meta__fact-key {
    color: var(--text-color-medium);
    font-size: 12px;
}

.pdk_dashboard-page__subscription-meta__fact-value {
    color: var(--text-color-high);
    font-weight: 600;
}

.pdk_dashboard-page__subscription-meta__actions {
    display: flex;
    margin-left: auto;
    gap: 6px;
}

.pdk_dashboard-page .btn.pdk_dashboard-page__subscription-meta__action {
    width: 28px;
    height: 28px;
    min-width: 28px;
    padding: 2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.pdk_dashboard-page__subscription-meta__action svg {
    width: 15px;
    height: 15px;
}

.pdk_dashboard-page__subscription-meta__announce {
    margin: 6px 0 0;
    border-left: 3px solid var(--primary-color-medium, dodgerblue);
    padding: 4px 8px;
    background: var(--background-color-low, rgba(0, 0, 0, 0.04));
}

.pdk_dashboard-page__outbound-grid__item {
    border: 2px var(--background-color-low, lightgray) solid;
    border-radius: 4px;
    padding: 10px;
    transition: border 0.2s ease;
    min-width: 0;
    position: relative;
}

.pdk_dashboard-page__outbound-grid__item--switching {
    border-color: transparent !important;
    overflow: hidden;
    cursor: wait;
}

.pdk_dashboard-page__outbound-grid__item__snake {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.pdk_dashboard-page__outbound-grid__item__snake rect {
    stroke: var(--primary-color-high, dodgerblue);
    stroke-width: 4;
    animation: pdk-dashboard-selector-snake 1.2s linear infinite;
}

@keyframes pdk-dashboard-selector-snake {
    from { stroke-dasharray: 30 70; stroke-dashoffset: 100; }
    to { stroke-dasharray: 30 70; stroke-dashoffset: 0; }
}

.pdk_dashboard-page__outbound-grid__item__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
}

.pdk_dashboard-page__outbound-grid__item__header b {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    overflow-wrap: anywhere;
}

.harpynet-country-flag {
    flex: 0 0 auto;
    width: 20px;
    height: 14px;
    object-fit: cover;
    border-radius: 2px;
    box-shadow: 0 0 0 1px rgba(127, 127, 127, 0.28);
}

.pdk_dashboard-page__outbound-grid__item--selectable {
    cursor: pointer;
}

.pdk_dashboard-page__outbound-grid__item--selectable:hover {
    border-color: var(--primary-color-high, dodgerblue);
}

.pdk_dashboard-page__outbound-grid__item--active {
    border-color: var(--success-color-medium, green);
}

.pdk_dashboard-page__outbound-grid__item__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
}

.pdk_dashboard-page__outbound-grid__item__type {}

.pdk_dashboard-page__outbound-grid__item__latency--empty {
    color: var(--primary-color-low, lightgray);
}

.pdk_dashboard-page__outbound-grid__item__latency--green {
    color: var(--success-color-medium, green);
}

.pdk_dashboard-page__outbound-grid__item__latency--yellow {
    color: var(--warn-color-medium, orange);
}

.pdk_dashboard-page__outbound-grid__item__latency--red {
    color: var(--error-color-medium, red);
}

`;
