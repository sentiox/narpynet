"use strict";
"require view";
"require form";
"require baseclass";
"require network";
"require fs";
"require view.harpynet.main-v022 as main";
"require view.harpynet.settings-v010 as settings";
"require view.harpynet.section-v007 as section";
"require view.harpynet.devices-v013 as devices";
"require view.harpynet.dashboard-v010 as dashboard";
"require view.harpynet.diagnostic-v004 as diagnostic";
"require view.harpynet.logs-v019 as logs";
"require view.harpynet.flags-v001 as countryFlags";

function clampPercent(value) {
  return Math.max(0, Math.min(Number(value) || 0, 100));
}

function temperatureLevel(value) {
  if (value === null || value === undefined) return 0;
  return Math.max(4, Math.min(Math.round((Number(value) - 30) * 1.6), 100));
}

function temperatureClass(value) {
  if (value === null || value === undefined) return "cool";
  if (value >= 75) return "hot";
  if (value >= 62) return "warm";
  return "cool";
}

function renderMetric(key, label) {
  return E("div", {
    class: `harpynet-header-stat ${key}`,
    "data-stat": key,
  }, [
    E("span", { class: "harpynet-header-stat__label" }, label),
    E("strong", { class: "harpynet-header-stat__value" }, "—"),
  ]);
}

function renderDetail(key, label) {
  const value = key === "wan"
    ? E("strong", {
        class: "harpynet-header-detail__value is-private",
        tabindex: "0",
        title: "Показать IP",
        click: (event) => event.currentTarget.classList.toggle("is-revealed"),
      }, [
        E("span", { class: "harpynet-private-mask" }, "—"),
        E("span", { class: "harpynet-private-full" }, "—"),
      ])
    : E("strong", { class: "harpynet-header-detail__value" },
        key === "server"
          ? [
              E("span", { class: "harpynet-header-server-flag" }),
              E("span", { class: "harpynet-header-server-name" }, "—"),
            ]
          : "—");

  return E("div", { class: "harpynet-header-detail", "data-detail": key }, [
    E("span", { class: "harpynet-header-detail__label" }, label),
    value,
  ]);
}

function maskIpAddress(value) {
  const parts = String(value || "").split(".");
  if (parts.length !== 4) return "••••••••";
  return `${parts[0]}.•••.•••.${parts[3]}`;
}

function updateMetric(key, value, level, extraClass) {
  const metric = document.querySelector(`[data-stat="${key}"]`);
  if (!metric) return;
  metric.style.setProperty("--harpynet-stat-level", `${level}%`);
  metric.classList.remove("cool", "warm", "hot");
  if (extraClass) metric.classList.add(extraClass);
  const valueNode = metric.querySelector(".harpynet-header-stat__value");
  if (valueNode) valueNode.textContent = value;
}

function updateDetail(key, value, title) {
  const detail = document.querySelector(`[data-detail="${key}"]`);
  if (!detail) return;
  const valueNode = detail.querySelector(".harpynet-header-detail__value");
  if (valueNode) {
    if (key === "wan" && value !== "—") {
      const maskNode = valueNode.querySelector(".harpynet-private-mask");
      const fullNode = valueNode.querySelector(".harpynet-private-full");
      if (maskNode) maskNode.textContent = maskIpAddress(value);
      if (fullNode) fullNode.textContent = value;
      valueNode.setAttribute("aria-label", value);
    } else if (key === "server" && value !== "—") {
      const country = countryFlags.inferCountryCode(value);
      const flagSlot = valueNode.querySelector(".harpynet-header-server-flag");
      const nameNode = valueNode.querySelector(".harpynet-header-server-name");
      if (flagSlot) {
        flagSlot.replaceChildren();
        const flag = countryFlags.renderCountryFlag(country, value);
        if (flag) flagSlot.appendChild(flag);
      }
      if (nameNode) nameNode.textContent = countryFlags.stripCountryPrefix(value, country);
      valueNode.title = title || value;
    } else {
      valueNode.textContent = value;
      valueNode.title = title || value;
    }
  }
}

async function refreshHeaderStats() {
  try {
    const response = await fs.exec("/usr/bin/harpynet", ["get_runtime_stats"]);
    const stats = JSON.parse((response.stdout || "").trim());
    const cpu = clampPercent(stats.cpu);
    const memory = clampPercent(stats.memory);
    const temperature = Number(stats.temperature);
    const validTemperature = Number.isFinite(temperature) ? temperature : null;
    updateMetric("cpu", `${cpu}%`, cpu);
    updateMetric("memory", `${memory}%`, memory);
    updateMetric(
      "temperature",
      validTemperature === null ? "—" : `${validTemperature.toFixed(1)}°C`,
      temperatureLevel(validTemperature),
      temperatureClass(validTemperature),
    );

    updateDetail("wan", stats.wan_ip || "—");
    updateDetail("server", stats.selected_server || "—", stats.selected_server);
  } catch (error) {
    updateMetric("cpu", "—", 0);
    updateMetric("memory", "—", 0);
    updateMetric("temperature", "—", 0, "cool");
  }
}

function startHeaderStats() {
  if (window.harpyNetHeaderStatsTimer) window.clearInterval(window.harpyNetHeaderStatsTimer);
  refreshHeaderStats();
  window.harpyNetHeaderStatsTimer = window.setInterval(refreshHeaderStats, 5000);
}

function fixCbiLabelTargets(root) {
  root = root || document;
  const fields = () => Array.from(root.querySelectorAll(".cbi-value-field input, .cbi-value-field select, .cbi-value-field textarea, .cbi-value-field button"));

  fields().forEach((field, index) => {
    const value = field.closest(".cbi-value");
    const base = value?.id || field.getAttribute("name") || `harpynet-field-${index}`;

    if (!field.id) field.id = `${base.replace(/[^A-Za-z0-9_-]/g, "_")}-input`;
    if (!field.getAttribute("name")) field.setAttribute("name", field.id);
  });

  root.querySelectorAll(".cbi-value-title[for]").forEach((label) => {
    const currentTarget = label.getAttribute("for");
    const value = label.closest(".cbi-value");

    if (value?.dataset.widget === "CBI.DynamicList") {
      label.removeAttribute("for");
      return;
    }

    if (currentTarget && document.getElementById(currentTarget)) return;

    const namedField = currentTarget
      ? fields().find((field) => field.getAttribute("name") === currentTarget)
      : null;
    if (namedField) {
      namedField.id = currentTarget;
      return;
    }

    const field = value?.querySelector(".cbi-value-field input, .cbi-value-field select, .cbi-value-field textarea, .cbi-value-field button");
    if (!field) {
      label.removeAttribute("for");
      return;
    }

    if (!field.id) {
      const base = value?.id || field.getAttribute("name") || currentTarget || "harpynet-field";
      field.id = `${base.replace(/[^A-Za-z0-9_-]/g, "_")}-input`;
    }

    label.setAttribute("for", field.id);
  });
}

function scheduleCbiLabelFixes(root) {
  fixCbiLabelTargets(root);
  fixCbiLabelTargets(document);
  window.setTimeout(() => fixCbiLabelTargets(root), 250);
  window.setTimeout(() => fixCbiLabelTargets(document), 250);
  window.setTimeout(() => fixCbiLabelTargets(root), 1000);
  window.setTimeout(() => fixCbiLabelTargets(document), 1000);
  window.setTimeout(() => fixCbiLabelTargets(document), 2500);
}

const EntryPoint = {
  async render() {
    main.injectGlobalStyles();
    document.head.appendChild(E("style", {}, `
#cbi-harpynet-dashboard-_mount_node,
#cbi-harpynet-diagnostic-_mount_node,
#cbi-harpynet-logs-_mount_node,
#cbi-harpynet-devices-_mount_node { display:block!important; width:100%!important; margin:0; }
#cbi-harpynet-dashboard-_mount_node > output,
#cbi-harpynet-diagnostic-_mount_node > output,
#cbi-harpynet-logs-_mount_node > output,
#cbi-harpynet-devices-_mount_node > output { display:block; width:100%!important; max-width:none; margin:0; }
.pdk_dashboard-page,.pdk_diagnostic-page,.pdk_logs-page,.pdk_logs-page__panel {
  width:100%!important; box-sizing:border-box;
}
.harpynet-page-header {
  position:relative;
  min-height:58px;
}
.harpynet-page-header__copy { display:grid; gap:4px; align-content:start; }
.harpynet-page-header h2 { margin:0; }
.harpynet-page-header__description { color:var(--text-color-medium); }
.harpynet-header-monitor {
  position:absolute;
  top:8px;
  right:0;
  display:grid;
  justify-items:end;
  gap:8px;
  width:340px;
  max-width:100%;
}
.harpynet-header-stats,.harpynet-header-details { display:flex; align-items:center; justify-content:flex-end; gap:8px; }
.harpynet-header-stats {
  width:100%;
}
.harpynet-header-stat {
  flex:1 1 0;
  min-width:0;
}
.harpynet-header-details {
  display:grid;
  grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);
  width:100%;
}
#cbi-harpynet-section {
  margin-top:4px;
}
.harpynet-header-stat {
  --harpynet-stat-level:0%; position:relative; display:grid; grid-template-columns:auto auto;
  gap:8px; align-items:center; min-width:92px; height:32px; box-sizing:border-box; overflow:hidden;
  border:1px solid rgba(127,127,127,.28); border-radius:4px; padding:0 9px;
  background:linear-gradient(90deg,color-mix(in srgb,var(--primary-color-high,#1976d2) 22%,transparent)
  var(--harpynet-stat-level),transparent var(--harpynet-stat-level));
}
.harpynet-header-stat::after {
  content:""; position:absolute; left:0; bottom:0; width:var(--harpynet-stat-level); height:2px;
  background:var(--primary-color-high,#1976d2);
}
.harpynet-header-stat.temperature.warm::after { background:var(--warn-color-medium,#e6a700); }
.harpynet-header-stat.temperature.hot::after { background:var(--error-color-medium,#d32f2f); }
.harpynet-header-stat__label,.harpynet-header-detail__label {
  position:relative; z-index:1; color:var(--text-color-medium); font-size:11px; font-weight:700;
}
.harpynet-header-stat__value { position:relative; z-index:1; color:var(--text-color-high); text-align:right; white-space:nowrap; }
.harpynet-header-detail {
  display:flex; align-items:center; justify-content:space-between; gap:6px;
  width:100%; min-width:0; height:32px; box-sizing:border-box; overflow:hidden;
  border:1px solid rgba(127,127,127,.28); border-radius:4px; padding:0 9px;
  background:rgba(127,127,127,.04);
}
.harpynet-header-detail__value {
  position:relative;
  min-width:0; max-width:none; overflow:hidden; text-overflow:ellipsis;
  color:var(--text-color-high); font-size:12px; text-align:right; white-space:nowrap;
}
.harpynet-header-detail__value:has(.harpynet-header-server-name) {
  display:inline-flex;
  align-items:center;
  gap:7px;
}
.harpynet-header-server-flag {
  display:inline-flex;
  flex:0 0 auto;
}
.harpynet-header-detail__value.is-private {
  cursor:pointer;
  outline:none;
}
.harpynet-private-full { display:none; }
.harpynet-header-detail__value.is-private:hover .harpynet-private-mask,
.harpynet-header-detail__value.is-private:focus .harpynet-private-mask,
.harpynet-header-detail__value.is-private.is-revealed .harpynet-private-mask { display:none; }
.harpynet-header-detail__value.is-private:hover .harpynet-private-full,
.harpynet-header-detail__value.is-private:focus .harpynet-private-full,
.harpynet-header-detail__value.is-private.is-revealed .harpynet-private-full { display:inline; }
@media(max-width:900px) {
  .harpynet-page-header { display:flex; flex-direction:column; gap:8px; }
  .harpynet-header-monitor {
    position:static;
    width:100%;
    justify-items:stretch;
  }
  .harpynet-header-stats,.harpynet-header-details { justify-content:flex-start; flex-wrap:wrap; }
  .harpynet-header-details { grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr); }
  #cbi-harpynet-section { margin-top:0; }
}
`));

    const harpynetMap = new form.Map("harpynet", _("HarpyNet"), _("Configuration for HarpyNet service"));
    harpynetMap.tabbed = true;
    const sectionsSection = harpynetMap.section(form.TypedSection, "section", _("Sections"));
    sectionsSection.anonymous = false; sectionsSection.addremove = true; sectionsSection.template = "cbi/simpleform";
    section.createSectionContent(sectionsSection);
    const dashboardSection = harpynetMap.section(form.TypedSection, "dashboard", _("Dashboard"));
    dashboardSection.anonymous = true; dashboardSection.addremove = false; dashboardSection.cfgsections = () => ["dashboard"];
    dashboard.createDashboardContent(dashboardSection);
    const settingsSection = harpynetMap.section(form.TypedSection, "settings", _("Settings"));
    settingsSection.anonymous = true; settingsSection.addremove = false; settingsSection.cfgsections = () => ["settings"];
    settings.createSettingsContent(settingsSection);
    const diagnosticSection = harpynetMap.section(form.TypedSection, "diagnostic", _("Diagnostics"));
    diagnosticSection.anonymous = true; diagnosticSection.addremove = false; diagnosticSection.cfgsections = () => ["diagnostic"];
    diagnostic.createDiagnosticContent(diagnosticSection);
    const devicesSection = harpynetMap.section(form.TypedSection, "devices", "Устройства");
    devicesSection.anonymous = true; devicesSection.addremove = false; devicesSection.cfgsections = () => ["devices"];
    devices.createDevicesContent(devicesSection);
    const logsSection = harpynetMap.section(form.TypedSection, "logs", "Логи");
    logsSection.anonymous = true; logsSection.addremove = false; logsSection.cfgsections = () => ["logs"];
    logs.createLogsContent(logsSection);

    main.coreService();
    const rendered = await harpynetMap.render();
    const title = rendered.querySelector("h2");
    if (title) {
      const description = title.nextElementSibling;
      const monitor = E("div", { class: "harpynet-header-monitor" }, [
        E("div", { class: "harpynet-header-stats" }, [
          renderMetric("cpu", "CPU"), renderMetric("memory", "ПАМЯТЬ"), renderMetric("temperature", "ТЕМП"),
        ]),
        E("div", { class: "harpynet-header-details" }, [
          renderDetail("wan", "WAN"),
          renderDetail("server", "СЕРВЕР"),
        ]),
      ]);
      const copy = E("div", { class: "harpynet-page-header__copy" }, [
        title.cloneNode(true),
        description
          ? E("div", { class: "harpynet-page-header__description" }, description.textContent)
          : null,
      ].filter(Boolean));
      title.replaceWith(E("div", { class: "harpynet-page-header" }, [copy, monitor]));
      if (description) description.remove();
    }
    window.setTimeout(startHeaderStats, 0);
    window.setTimeout(() => scheduleCbiLabelFixes(rendered), 0);
    return rendered;
  },
};

return view.extend(EntryPoint);
