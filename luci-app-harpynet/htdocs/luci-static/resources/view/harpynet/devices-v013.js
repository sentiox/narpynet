"use strict";
"require baseclass";
"require form";
"require ui";
"require uci";
"require fs";
"require view.harpynet.main-v014 as main";

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  document.head.appendChild(E("style", {}, `
#cbi-harpynet-devices-_mount_node { display:block!important; width:100%!important; margin:0; }
.harpynet-devices { display:grid; gap:10px; width:100%; max-width:none; }
.harpynet-devices__toolbar {
  display:grid;
  grid-template-columns:27% 21% 18% minmax(240px,1fr);
  align-items:center;
  gap:10px;
}
.harpynet-devices__toolbar-actions {
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:6px;
  grid-column:4;
}
.harpynet-devices__filters { display:flex; flex-wrap:wrap; gap:6px; grid-column:1 / 4; }
.harpynet-devices .btn.harpynet-devices__filter { display:inline-flex; align-items:center; gap:6px; min-height:30px; padding:4px 9px!important; }
.harpynet-devices__filter-count {
  display:inline-flex; align-items:center; justify-content:center;
  min-width:16px; height:16px; padding:0 4px; border-radius:999px;
  color:var(--text-color-high,#dce8ee);
  background:rgba(92,123,140,.28);
  border:1px solid rgba(135,165,180,.28);
  font-size:11px;
  line-height:16px;
  font-weight:700;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
}
.harpynet-devices__table { width:100%; border-collapse:collapse; table-layout:fixed; }
.harpynet-devices__table th,
.harpynet-devices__table td { padding:6px 8px; border-bottom:1px solid rgba(127,127,127,.2); vertical-align:middle; }
.harpynet-devices__table th { color:var(--text-color-medium); font-size:12px; font-weight:700; text-align:left; }
.harpynet-devices__device { display:grid; gap:2px; min-width:0; }
.harpynet-devices__name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:800; color:var(--text-color-high); }
.harpynet-devices__meta { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-color-medium); font-size:12px; }
.harpynet-devices__status { display:inline-flex; align-items:center; gap:5px; color:var(--success-color-medium,#25a55f); font-weight:700; }
.harpynet-devices__status::before { content:""; width:7px; height:7px; border-radius:50%; background:currentColor; }
.harpynet-devices__status.is-offline { color:var(--error-color-medium,#e04f5f); }
.harpynet-devices__table th:nth-child(1),
.harpynet-devices__table td:nth-child(1) { width:27%; }
.harpynet-devices__table th:nth-child(2),
.harpynet-devices__table td:nth-child(2) { width:21%; }
.harpynet-devices__table th:nth-child(3),
.harpynet-devices__table td:nth-child(3) { width:18%; text-align:center; }
.harpynet-devices__table th:nth-child(4),
.harpynet-devices__table td:nth-child(4) { width:34%; text-align:right; }
.harpynet-devices__table th:nth-child(4) { text-align:right; padding-right:98px; }
.harpynet-devices__actions { display:flex; justify-content:flex-end; }
.harpynet-devices__mode-select { width:180px; max-width:100%; }
.harpynet-devices__mode-select.is-pending { border-color:var(--primary-color-high,#00bcd4); box-shadow:0 0 0 1px color-mix(in srgb,var(--primary-color-high,#00bcd4) 35%,transparent); }
#cbi-harpynet-devices .cbi-page-actions {
  display:flex;
  justify-content:flex-end;
  align-items:center;
  gap:4px;
  padding:14px 18px 14px 14px!important;
  margin-top:0!important;
  border-top:1px solid rgba(127,127,127,.22);
}
#cbi-harpynet-devices .cbi-page-actions .btn,
#cbi-harpynet-devices .cbi-page-actions .cbi-button {
  min-height:30px;
}
.harpynet-devices__filter.is-active {
  color:var(--primary-color-high,#00bcd4);
  border-color:var(--primary-color-high,#00bcd4);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--primary-color-high,#00bcd4) 35%,transparent);
}
.harpynet-devices__filter.is-active .harpynet-devices__filter-count {
  color:var(--primary-color-high,#00bcd4);
  background:rgba(0,188,212,.14);
  border-color:rgba(0,188,212,.38);
}
.harpynet-devices__chooser { min-width:min(620px,100%); }
.harpynet-devices__chooser-row {
  display:grid; grid-template-columns:minmax(0,1.2fr) auto; gap:10px; align-items:center;
  padding:8px 0; border-bottom:1px solid rgba(127,127,127,.18);
}
.harpynet-devices__chooser-device { display:grid; gap:2px; min-width:0; }
.harpynet-devices__chooser-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:800; }
.harpynet-devices__chooser-meta { color:var(--text-color-medium); font-size:12px; }
.harpynet-devices__chooser-actions { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; }
.harpynet-devices__chooser-actions .btn { min-height:30px; }
.harpynet-devices__empty,
.harpynet-devices__error { color:var(--text-color-medium); padding:8px 0; }
@media(max-width:720px) {
  .harpynet-devices__table,
  .harpynet-devices__table tbody,
  .harpynet-devices__table tr,
  .harpynet-devices__table td { display:block; width:100%; }
  .harpynet-devices__table thead { display:none; }
  .harpynet-devices__table tr { padding:8px 0; border-bottom:1px solid rgba(127,127,127,.22); }
  .harpynet-devices__table td { border:0; padding:3px 0; }
  .harpynet-devices__table th:nth-child(1),
  .harpynet-devices__table td:nth-child(1),
  .harpynet-devices__table th:nth-child(2),
  .harpynet-devices__table td:nth-child(2),
  .harpynet-devices__table th:nth-child(3),
  .harpynet-devices__table td:nth-child(3),
  .harpynet-devices__table th:nth-child(4),
  .harpynet-devices__table td:nth-child(4) { width:100%; text-align:left; }
  .harpynet-devices__toolbar { grid-template-columns:1fr; }
  .harpynet-devices__filters { grid-column:auto; }
  .harpynet-devices__toolbar-actions { grid-column:auto; justify-content:flex-start; }
  .harpynet-devices__actions,
  .harpynet-devices__chooser-actions { justify-content:flex-start; }
  #cbi-harpynet-devices .cbi-page-actions { justify-content:flex-start; padding:12px 10px!important; }
}
`));
}

function normalizeListValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function addUniqueValue(values, value) {
  return values.includes(value) ? values : values.concat(value);
}

function removeValue(values, value) {
  return values.filter((item) => item !== value);
}

function getPrimaryProxySection() {
  const sections = uci.sections("harpynet", "section") || [];
  return sections.find((section) => ["proxy", "full_proxy", "full_proxy_bypass_ru"].includes(section.connection_type)) || sections[0];
}

async function applyDeviceRouteMode(mode, ip) {
  const response = await fs.exec("/usr/bin/harpynet", ["set_device_route", ip, mode]);
  const payload = JSON.parse((response.stdout || "{}").trim() || "{}");

  if (!payload.success) {
    throw new Error(payload.error || response.stderr || "Не удалось применить режим");
  }

  uci.unload("harpynet");
  await uci.load("harpynet");

  const labels = {
    default: "По умолчанию",
    proxy: "Умный обход",
    full_proxy: "Полный VPN",
    full_proxy_bypass_ru: "Полный VPN без РФ",
    exclude: "Выключить VPN",
  };
  ui.addNotification(null, E("p", {}, `IP ${ip}: ${labels[mode] || mode} сохранён.`), "info");
}

function getDeviceRouteMode(ip) {
  const proxySection = getPrimaryProxySection();
  const excluded = normalizeListValue(uci.get("harpynet", "settings", "routing_excluded_ips"));

  if (excluded.includes(ip)) {
    return "exclude";
  }

  if (proxySection && proxySection[".name"]) {
    const bypassRuRouted = normalizeListValue(uci.get("harpynet", proxySection[".name"], "bypass_ru_routed_ips"));
    if (bypassRuRouted.includes(ip)) {
      return "full_proxy_bypass_ru";
    }

    const routed = normalizeListValue(uci.get("harpynet", proxySection[".name"], "fully_routed_ips"));
    if (routed.includes(ip)) {
      return "full_proxy";
    }
  }

  return "default";
}

function renderModeOption(currentMode, value, label) {
  const attrs = { value };

  if (currentMode === value) {
    attrs.selected = "selected";
  }

  return E("option", attrs, label);
}

function getDhcpDevices() {
  const methods = main.HarpyNetShellMethods || {};

  if (!methods.getDhcpClients) {
    return Promise.resolve([]);
  }

  return methods.getDhcpClients().then((response) => {
    if (!response || !response.success || !response.data) return [];

    if (Array.isArray(response.data.devices) && response.data.devices.length) {
      return response.data.devices
        .map((device) => ({
          ip: device.ip,
          name: device.name || "Неизвестное устройство",
          mac: device.mac || "",
          connection: device.connection || "Ранее в сети",
          ssid: device.ssid || "",
        }))
        .sort((a, b) => a.ip.localeCompare(b.ip, undefined, { numeric: true }));
    }

    const clients = response.data.clients || {};
    return Object.keys(clients)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((ip) => ({
        ip,
        name: clients[ip] || "Неизвестное устройство",
        mac: "",
        connection: ip.endsWith(".1") ? "Router" : "Ранее в сети",
        ssid: "",
      }));
  });
}

function isPrivateMac(mac) {
  const firstOctet = parseInt(String(mac || "").split(":")[0], 16);
  return Number.isInteger(firstOctet) && Boolean(firstOctet & 2);
}

function normalizeConnectionLabel(connection) {
  return connection && connection !== "Не определено" ? connection : "Ранее в сети";
}

function getConnectionLabel(device) {
  const connection = normalizeConnectionLabel(device.connection);

  if (connection === "Ранее в сети" && isPrivateMac(device.mac)) {
    return "Ранее в сети / приватный MAC";
  }

  return device.ssid ? `${connection} / ${device.ssid}` : connection;
}

function isDeviceOnline(device) {
  const label = getConnectionLabel(device).toLowerCase();
  return !label.includes("не активно") && !label.includes("ранее в сети");
}

function getFilterKey(device) {
  const connection = normalizeConnectionLabel(device.connection);
  if (connection === "Router") return "router";
  if (connection === "LAN 1") return "lan1";
  if (connection === "LAN 2") return "lan2";
  if (connection === "LAN 3") return "lan3";
  if (connection === "LAN 4") return "lan4";
  if (connection && connection.startsWith("LAN")) return "lan";
  if (connection === "Wi-Fi 2.4") return "wifi24";
  if (connection === "Wi-Fi 5G") return "wifi5";
  if (connection && connection.startsWith("Wi-Fi")) return "wifi";
  return "network";
}

const filterLabels = {
  all: "Все",
  router: "Router",
  lan1: "LAN 1",
  lan2: "LAN 2",
  lan3: "LAN 3",
  lan4: "LAN 4",
  lan: "LAN",
  wifi24: "Wi-Fi 2.4",
  wifi5: "Wi-Fi 5G",
  wifi: "Wi-Fi / не активно",
  network: "Ранее в сети",
};

function openGroupChooser(filterKey, devices) {
  const groupDevices = filterKey === "all"
    ? devices
    : devices.filter((device) => getFilterKey(device) === filterKey);
  const title = `${filterLabels[filterKey] || "Устройства"} (${groupDevices.length})`;

  ui.showModal(title, [
    E("div", { class: "harpynet-devices__chooser" }, groupDevices.length
      ? groupDevices.map((device) => E("div", { class: "harpynet-devices__chooser-row" }, [
          E("div", { class: "harpynet-devices__chooser-device" }, [
            E("span", { class: "harpynet-devices__chooser-name", title: device.name }, device.name),
            E("span", { class: "harpynet-devices__chooser-meta" }, [
              device.ip,
              " · ",
              getConnectionLabel(device),
            ]),
          ]),
          E("div", { class: "harpynet-devices__chooser-actions" }, [
            E("button", { class: "btn cbi-button cbi-button-positive", click: async () => { await applyDeviceRouteMode("proxy", device.ip); ui.hideModal(); } }, "Умный обход"),
            E("button", { class: "btn cbi-button cbi-button-positive", click: async () => { await applyDeviceRouteMode("full_proxy", device.ip); ui.hideModal(); } }, "Полный VPN"),
            E("button", { class: "btn cbi-button cbi-button-positive", click: async () => { await applyDeviceRouteMode("full_proxy_bypass_ru", device.ip); ui.hideModal(); } }, "Полный VPN без РФ"),
            E("button", { class: "btn cbi-button cbi-button-neutral", click: async () => { await applyDeviceRouteMode("exclude", device.ip); ui.hideModal(); } }, "Выключить VPN"),
            E("button", { class: "btn cbi-button", click: async () => { await applyDeviceRouteMode("default", device.ip); ui.hideModal(); } }, "По умолчанию"),
          ]),
        ]))
      : [E("div", { class: "harpynet-devices__empty" }, "В этой группе устройств нет")]
    ),
    E("div", { class: "right" }, [
      E("button", { class: "btn cbi-button cbi-button-neutral", click: () => ui.hideModal() }, "Закрыть"),
    ]),
  ]);
}

function renderDevicesContent() {
  injectStyles();

  let devicesCache = [];
  let activeFilter = "all";
  const pendingModes = {};
  const filters = E("div", { class: "harpynet-devices__filters" });
  const body = E("tbody", {}, [
    E("tr", {}, [
      E("td", { colspan: "4", class: "harpynet-devices__empty" }, "Загрузка устройств..."),
    ]),
  ]);

  const root = E("div", { class: "harpynet-devices" }, [
    E("div", { class: "harpynet-devices__toolbar" }, [
      filters,
      E("div", { class: "harpynet-devices__toolbar-actions" }, [
        E("button", { class: "btn cbi-button cbi-button-positive", type: "button", "data-devices-apply": "1", disabled: "disabled" }, "Применить"),
        E("button", { class: "btn cbi-button", type: "button", "data-devices-refresh": "1" }, "Обновить"),
      ]),
    ]),
    E("table", { class: "harpynet-devices__table" }, [
      E("thead", {}, [
        E("tr", {}, [
          E("th", {}, "Устройство"),
          E("th", {}, "IP"),
          E("th", {}, "Статус"),
          E("th", {}, "Режим"),
        ]),
      ]),
      body,
    ]),
  ]);

  const renderFilters = () => {
    const counts = devicesCache.reduce((acc, device) => {
      const key = getFilterKey(device);
      acc.all = (acc.all || 0) + 1;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const order = ["all", "router", "lan1", "lan2", "lan3", "lan4", "lan", "wifi24", "wifi5", "wifi", "network"];
    const available = order.filter((key) => counts[key]);

    filters.replaceChildren(...available.map((key) => E("button", {
      class: [
        "btn",
        "cbi-button",
        "harpynet-devices__filter",
        activeFilter === key ? "is-active" : "",
      ].filter(Boolean).join(" "),
      type: "button",
      "data-device-filter": key,
    }, [
      E("span", { class: "harpynet-devices__filter-label" }, filterLabels[key]),
      E("span", { class: "harpynet-devices__filter-count" }, counts[key]),
    ])));
  };

  const getPendingCount = () => Object.keys(pendingModes).length;

  const refreshApplyButton = () => {
    const applyButton = root.querySelector("[data-devices-apply]");
    if (!applyButton) return;

    const count = getPendingCount();
    applyButton.disabled = count === 0;
    applyButton.textContent = count ? `Применить (${count})` : "Применить";
  };

  const renderRows = () => {
    const visibleDevices = activeFilter === "all"
      ? devicesCache
      : devicesCache.filter((device) => getFilterKey(device) === activeFilter);

    if (!visibleDevices.length) {
      body.replaceChildren(E("tr", {}, [
        E("td", { colspan: "4", class: "harpynet-devices__empty" }, "Онлайн-устройства не найдены"),
      ]));
      return;
    }

    body.replaceChildren(...visibleDevices.map((device) => {
      const savedMode = getDeviceRouteMode(device.ip);
      const currentMode = pendingModes[device.ip] || savedMode;
      const isPending = pendingModes[device.ip] && pendingModes[device.ip] !== savedMode;

      return E("tr", {}, [
      E("td", {}, [
        E("div", { class: "harpynet-devices__device" }, [
          E("span", { class: "harpynet-devices__name", title: device.name }, device.name),
          E("span", { class: "harpynet-devices__meta" }, getConnectionLabel(device)),
        ]),
      ]),
      E("td", {}, device.ip),
      E("td", {}, E("span", {
        class: [
          "harpynet-devices__status",
          isDeviceOnline(device) ? "" : "is-offline",
        ].filter(Boolean).join(" "),
      }, isDeviceOnline(device) ? "онлайн" : "офлайн")),
      E("td", {}, [
        E("div", { class: "harpynet-devices__actions" }, [
          E("select", {
            class: [
              "cbi-input-select",
              "harpynet-devices__mode-select",
              isPending ? "is-pending" : "",
            ].filter(Boolean).join(" "),
            "data-device-mode-ip": device.ip,
          }, [
            renderModeOption(currentMode, "default", "По умолчанию"),
            renderModeOption(currentMode, "proxy", "Умный обход"),
            renderModeOption(currentMode, "full_proxy", "Полный VPN"),
            renderModeOption(currentMode, "full_proxy_bypass_ru", "Полный VPN без РФ"),
            renderModeOption(currentMode, "exclude", "Выключить VPN"),
          ]),
        ]),
      ]),
      ]);
    }));

    refreshApplyButton();
  };

  const applyPendingModes = async () => {
    const changes = Object.entries(pendingModes);
    if (!changes.length) return;

    const applyButton = root.querySelector("[data-devices-apply]");
    if (applyButton) applyButton.disabled = true;

    try {
      for (const [ip, mode] of changes) {
        await applyDeviceRouteMode(mode, ip);
      }

      await fs.exec("/etc/init.d/harpynet", ["restart"]);
      ui.addNotification(null, E("p", {}, `Режимы устройств применены. HarpyNet перезапущен один раз.`), "info");
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      ui.addNotification(null, E("p", {}, error.message || String(error)), "error");
      refreshApplyButton();
    }
  };

  const load = () => {
    body.replaceChildren(E("tr", {}, [
      E("td", { colspan: "4", class: "harpynet-devices__empty" }, "Загрузка устройств..."),
    ]));

    getDhcpDevices()
      .then((devices) => {
        devicesCache = devices;
        renderFilters();
        renderRows();
      })
      .catch(() => {
        body.replaceChildren(E("tr", {}, [
          E("td", { colspan: "4", class: "harpynet-devices__error" }, "Не удалось загрузить устройства"),
        ]));
      });
  };

  root.addEventListener("click", (event) => {
    const eventTarget = event.target;
    const target = eventTarget && eventTarget.closest
      ? eventTarget.closest("button")
      : null;
    if (!target) return;

    if (target.dataset.devicesRefresh) {
      load();
      return;
    }

    if (target.dataset.devicesApply) {
      applyPendingModes();
      return;
    }

    if (target.dataset.deviceFilter) {
      activeFilter = target.dataset.deviceFilter;
      renderFilters();
      renderRows();
    }
  });

  root.addEventListener("change", async (event) => {
    const eventTarget = event.target;
    if (!eventTarget || !eventTarget.matches || !eventTarget.matches(".harpynet-devices__mode-select")) {
      return;
    }

    const ip = eventTarget.dataset.deviceModeIp;
    if (!ip) return;

    const savedValue = getDeviceRouteMode(ip);
    const nextValue = eventTarget.value;

    if (nextValue === savedValue) {
      delete pendingModes[ip];
    } else {
      pendingModes[ip] = nextValue;
    }

    renderRows();
  });

  window.setTimeout(load, 0);
  return root;
}

function createDevicesContent(section) {
  const mount = section.option(form.DummyValue, "_mount_node");
  mount.rawhtml = true;
  mount.cfgvalue = function () {
    return renderDevicesContent();
  };
}

const EntryPoint = {
  createDevicesContent,
};

return baseclass.extend(EntryPoint);
