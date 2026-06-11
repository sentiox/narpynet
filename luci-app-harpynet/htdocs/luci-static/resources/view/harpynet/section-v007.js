"use strict";
"require form";
"require baseclass";
"require ui";
"require uci";
"require view.harpynet.main-v014 as main";

let deviceRoutesStylesInjected = false;

function ensureDeviceRoutesStyles() {
  if (deviceRoutesStylesInjected) return;
  deviceRoutesStylesInjected = true;

  document.head.appendChild(E("style", {}, `
.harpynet-device-routes { display:grid; gap:8px; max-width:760px; }
.harpynet-device-routes__toolbar { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.harpynet-device-routes__title { font-weight:700; color:var(--text-color-high); }
.harpynet-device-routes__hint { color:var(--text-color-medium); font-size:12px; }
.harpynet-device-routes__filters { display:flex; flex-wrap:wrap; gap:6px; }
.harpynet-device-routes .btn.harpynet-device-routes__filter { min-height:26px; padding:3px 8px!important; }
.harpynet-device-routes__filter.is-active {
  color:var(--primary-color-high,#00bcd4);
  border-color:var(--primary-color-high,#00bcd4);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--primary-color-high,#00bcd4) 35%,transparent);
}
.harpynet-device-routes__table { width:100%; border-collapse:collapse; table-layout:fixed; }
.harpynet-device-routes__table th,
.harpynet-device-routes__table td { padding:5px 8px; border-bottom:1px solid rgba(127,127,127,.18); vertical-align:middle; }
.harpynet-device-routes__table th { padding:5px 8px; border-bottom:1px solid rgba(127,127,127,.28); vertical-align:middle; }
.harpynet-device-routes__table th { color:var(--text-color-medium); font-size:12px; font-weight:700; text-align:left; }
.harpynet-device-routes__device { display:grid; gap:2px; min-width:0; }
.harpynet-device-routes__name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:700; color:var(--text-color-high); }
.harpynet-device-routes__meta { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-color-medium); font-size:12px; }
.harpynet-device-routes__status { display:inline-flex; align-items:center; gap:5px; color:var(--success-color-medium,#25a55f); font-weight:700; }
.harpynet-device-routes__status::before { content:""; width:7px; height:7px; border-radius:50%; background:currentColor; }
.harpynet-device-routes__actions { display:flex; justify-content:flex-end; }
.harpynet-device-routes .btn { min-height:28px; padding:4px 8px!important; }
.harpynet-device-routes__empty,
.harpynet-device-routes__error { color:var(--text-color-medium); padding:8px 0; }
.harpynet-device-routes__chooser { min-width:min(420px,100%); }
.harpynet-device-routes__chooser-title { display:grid; gap:4px; padding-bottom:12px; }
.harpynet-device-routes__chooser-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:16px; font-weight:800; color:var(--text-color-high); }
.harpynet-device-routes__chooser-ip { color:var(--text-color-medium); font-size:12px; }
.harpynet-device-routes__chooser-connection { color:var(--primary-color-high,#00bcd4); font-size:12px; font-weight:700; }
.harpynet-device-routes__chooser-actions { display:grid; grid-template-columns:1fr; gap:8px; }
.harpynet-device-routes__chooser-actions .btn { width:100%; min-height:36px; justify-content:center; }
.harpynet-device-routes__chooser-close { margin-top:10px; width:100%; }
.harpynet-device-routes__group { display:grid; gap:8px; min-width:min(620px,100%); }
.harpynet-device-routes__group-row {
  display:grid; grid-template-columns:minmax(0,1.2fr) auto; gap:10px; align-items:center;
  padding:8px 0; border-bottom:1px solid rgba(127,127,127,.18);
}
.harpynet-device-routes__group-device { display:grid; gap:2px; min-width:0; }
.harpynet-device-routes__group-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:800; }
.harpynet-device-routes__group-meta { color:var(--text-color-medium); font-size:12px; }
.harpynet-device-routes__group-actions { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; }
.harpynet-device-routes__group-actions .btn { min-height:30px; }
@media(max-width:720px) {
  .harpynet-device-routes__table,
  .harpynet-device-routes__table tbody,
  .harpynet-device-routes__table tr,
  .harpynet-device-routes__table td { display:block; width:100%; }
  .harpynet-device-routes__table thead { display:none; }
  .harpynet-device-routes__table tr { padding:8px 0; border-bottom:1px solid rgba(127,127,127,.22); }
  .harpynet-device-routes__table td { border:0; padding:3px 0; }
  .harpynet-device-routes__actions { justify-content:flex-start; }
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
          connection: device.connection || "Не определено",
          interface: device.interface || "",
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
        connection: ip.endsWith(".1") ? "Router" : "Не определено",
        interface: "",
        ssid: "",
      }));
  });
}

function setCurrentSectionRoutedIp(option, sectionId, ip) {
  const uiElement = option.getUIElement(sectionId);
  const values = addUniqueValue(normalizeListValue(uiElement.getValue()), ip);
  uiElement.setValue(values);
  ui.addNotification(null, E("p", {}, `IP ${ip} добавлен в "Умный обход". Нажмите Save & Apply.`), "info");
}

function setGlobalExcludedIp(ip) {
  const current = normalizeListValue(uci.get("harpynet", "settings", "routing_excluded_ips"));
  uci.set("harpynet", "settings", "routing_excluded_ips", addUniqueValue(current, ip));
  ui.addNotification(null, E("p", {}, `IP ${ip} добавлен в "Выключить VPN". Нажмите Save & Apply.`), "info");
}

function setDefaultDeviceRoute(option, sectionId, ip) {
  const uiElement = option.getUIElement(sectionId);
  uiElement.setValue(removeValue(normalizeListValue(uiElement.getValue()), ip));

  const excluded = normalizeListValue(uci.get("harpynet", "settings", "routing_excluded_ips"));
  uci.set("harpynet", "settings", "routing_excluded_ips", removeValue(excluded, ip));
  ui.addNotification(null, E("p", {}, `IP ${ip} возвращён в режим по умолчанию. Нажмите Save & Apply.`), "info");
}

function applyDeviceRouteMode(mode, option, sectionId, ip) {
  if (mode === "proxy") {
    setCurrentSectionRoutedIp(option, sectionId, ip);
    return;
  }

  if (mode === "exclude") {
    setGlobalExcludedIp(ip);
    return;
  }

  if (mode === "default") {
    setDefaultDeviceRoute(option, sectionId, ip);
  }
}

function renderDeviceRoutes(sectionId, routedIpOption) {
  ensureDeviceRoutesStyles();

  const bodyId = `harpynet-device-routes-${sectionId}`;
  let devicesCache = [];
  let activeFilter = "all";
  const filters = E("div", { class: "harpynet-device-routes__filters" }, []);
  const body = E("tbody", { id: bodyId }, [
    E("tr", {}, [
      E("td", { colspan: "4", class: "harpynet-device-routes__empty" }, "Загрузка устройств...")
    ])
  ]);
  const root = E("div", { class: "harpynet-device-routes" }, [
    E("div", { class: "harpynet-device-routes__toolbar" }, [
      E("div", {}, [
        E("div", { class: "harpynet-device-routes__title" }, "Устройства в сети"),
      ]),
      E("button", { class: "btn cbi-button", type: "button", "data-device-routes-refresh": bodyId }, "Обновить")
    ]),
    filters,
    E("table", { class: "harpynet-device-routes__table" }, [
      E("thead", {}, [
        E("tr", {}, [
          E("th", {}, "Устройство"),
          E("th", {}, "IP"),
          E("th", {}, "Статус"),
          E("th", {}, "Режим"),
        ])
      ]),
      body
    ])
  ]);

  const load = () => {
    body.replaceChildren(E("tr", {}, [
      E("td", { colspan: "4", class: "harpynet-device-routes__empty" }, "Загрузка устройств...")
    ]));

    getDhcpDevices()
      .then((devices) => {
        devicesCache = devices;
        renderFilters();
        renderRows();
      })
      .catch(() => {
        body.replaceChildren(E("tr", {}, [
          E("td", { colspan: "4", class: "harpynet-device-routes__error" }, "Не удалось загрузить устройства")
        ]));
      });
  };

  const getFilterKey = (device) => {
    if (device.connection === "Router") return "router";
    if (device.connection === "LAN 1") return "lan1";
    if (device.connection === "LAN 2") return "lan2";
    if (device.connection === "LAN 3") return "lan3";
    if (device.connection === "LAN 4") return "lan4";
    if (device.connection && device.connection.startsWith("LAN")) return "lan";
    if (device.connection === "Wi-Fi 2.4") return "wifi24";
    if (device.connection === "Wi-Fi 5G") return "wifi5";
    if (device.connection && device.connection.startsWith("Wi-Fi")) return "wifi";
    return "network";
  };

  const filterLabels = {
    all: "Все",
    router: "Router",
    lan1: "LAN 1",
    lan2: "LAN 2",
    lan3: "LAN 3",
    lan4: "LAN 4",
    lan: "LAN",
    network: "Не определено",
    wifi24: "Wi-Fi 2.4",
    wifi5: "Wi-Fi 5G",
    wifi: "Wi-Fi / не активно",
  };

  const renderFilters = () => {
    const counts = devicesCache.reduce((acc, device) => {
      const key = getFilterKey(device);
      acc.all = (acc.all || 0) + 1;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const order = ["all", "router", "lan1", "lan2", "lan3", "lan4", "lan", "wifi24", "wifi5", "wifi", "network"];
    const available = order.filter((key) => counts[key]);

    if (!available.includes(activeFilter)) {
      activeFilter = "all";
    }

    filters.replaceChildren(...available.map((key) => E("button", {
      class: [
        "btn",
        "cbi-button",
        "harpynet-device-routes__filter",
      ].filter(Boolean).join(" "),
      type: "button",
      "data-device-route-filter": key,
    }, `${filterLabels[key]} ${counts[key]}`)));
  };

  const renderRows = () => {
    const devices = devicesCache;

    if (!devices.length) {
          body.replaceChildren(E("tr", {}, [
            E("td", { colspan: "4", class: "harpynet-device-routes__empty" }, "Онлайн-устройства не найдены")
          ]));
          return;
        }

        body.replaceChildren(...devices.map((device) => E("tr", {}, [
          E("td", {}, [
            E("div", { class: "harpynet-device-routes__device" }, [
              E("span", { class: "harpynet-device-routes__name", title: device.name }, device.name),
              E("span", { class: "harpynet-device-routes__meta" }, device.ssid ? `${device.connection} / ${device.ssid}` : device.connection)
            ])
          ]),
          E("td", {}, device.ip),
          E("td", {}, E("span", { class: "harpynet-device-routes__status" }, "онлайн")),
          E("td", {}, [
            E("div", { class: "harpynet-device-routes__actions" }, [
              E("button", { class: "btn cbi-button cbi-button-positive", type: "button", "data-device-route-open": device.ip, "data-device-route-name": device.name, "data-device-route-connection": device.ssid ? `${device.connection} / ${device.ssid}` : device.connection }, "Выбрать")
            ])
          ])
        ])));
  };

  const closeChooser = () => {
    ui.hideModal();
  };

  const openChooser = (button) => {
    const ip = button.dataset.deviceRouteOpen || "";
    const name = button.dataset.deviceRouteName || "Устройство";
    const connection = button.dataset.deviceRouteConnection || "";

    ui.showModal("Выбор режима устройства", [
      E("div", { class: "harpynet-device-routes__chooser" }, [
        E("div", { class: "harpynet-device-routes__chooser-title" }, [
          E("span", { class: "harpynet-device-routes__chooser-name" }, name),
          E("span", { class: "harpynet-device-routes__chooser-ip" }, ip),
          E("span", { class: "harpynet-device-routes__chooser-connection" }, connection),
        ]),
        E("div", { class: "harpynet-device-routes__chooser-actions" }, [
          E("button", {
            class: "btn cbi-button cbi-button-positive",
            type: "button",
            click: () => {
              setCurrentSectionRoutedIp(routedIpOption, sectionId, ip);
              closeChooser();
            },
          }, "Умный обход"),
          E("button", {
            class: "btn cbi-button cbi-button-neutral",
            type: "button",
            click: () => {
              setGlobalExcludedIp(ip);
              closeChooser();
            },
          }, "Выключить VPN"),
          E("button", {
            class: "btn cbi-button",
            type: "button",
            click: () => {
              setDefaultDeviceRoute(routedIpOption, sectionId, ip);
              closeChooser();
            },
          }, "По умолчанию"),
        ]),
      ]),
      E("div", { class: "right" }, [
        E("button", { class: "btn cbi-button cbi-button-neutral", click: closeChooser }, "Закрыть"),
      ]),
    ]);
  };

  const openGroupChooser = (filterKey) => {
    const devices = filterKey === "all"
      ? devicesCache
      : devicesCache.filter((device) => getFilterKey(device) === filterKey);
    const title = `${filterLabels[filterKey] || "Устройства"} (${devices.length})`;

    ui.showModal(title, [
      E("div", { class: "harpynet-device-routes__group" }, devices.length
        ? devices.map((device) => E("div", { class: "harpynet-device-routes__group-row" }, [
            E("div", { class: "harpynet-device-routes__group-device" }, [
              E("span", { class: "harpynet-device-routes__group-name", title: device.name }, device.name),
              E("span", { class: "harpynet-device-routes__group-meta" }, [
                device.ip,
                " · ",
                device.ssid ? `${device.connection} / ${device.ssid}` : device.connection,
              ]),
            ]),
            E("div", { class: "harpynet-device-routes__group-actions" }, [
              E("button", {
                class: "btn cbi-button cbi-button-positive",
                type: "button",
                click: () => {
                  applyDeviceRouteMode("proxy", routedIpOption, sectionId, device.ip);
                  ui.hideModal();
                },
              }, "Умный обход"),
              E("button", {
                class: "btn cbi-button cbi-button-neutral",
                type: "button",
                click: () => {
                  applyDeviceRouteMode("exclude", routedIpOption, sectionId, device.ip);
                  ui.hideModal();
                },
              }, "Выключить VPN"),
              E("button", {
                class: "btn cbi-button",
                type: "button",
                click: () => {
                  applyDeviceRouteMode("default", routedIpOption, sectionId, device.ip);
                  ui.hideModal();
                },
              }, "По умолчанию"),
            ]),
          ]))
        : [E("div", { class: "harpynet-device-routes__empty" }, "В этой группе устройств нет")]
      ),
      E("div", { class: "right" }, [
        E("button", { class: "btn cbi-button cbi-button-neutral", click: () => ui.hideModal() }, "Закрыть"),
      ]),
    ]);
  };

  root.addEventListener("click", (event) => {
    const eventTarget = event.target;
    const target = eventTarget && eventTarget.closest
      ? eventTarget.closest("button")
      : null;
    if (!target) return;

    if (target.dataset.deviceRoutesRefresh) {
      load();
      return;
    }

    if (target.dataset.deviceRouteFilter) {
      openGroupChooser(target.dataset.deviceRouteFilter);
      return;
    }

    if (target.dataset.deviceRouteOpen) {
      openChooser(target);
      return;
    }
  });

  window.setTimeout(load, 0);
  return root;
}

function createSectionContent(section) {
  let o = section.option(
    form.ListValue,
    "connection_type",
    _("Connection Type"),
    "Выберите: умный обход по спискам, полный VPN для всего внешнего трафика или пропуск напрямую",
  );
  o.value("proxy", "Умный обход");
  o.value("full_proxy", "Полный VPN");
  o.value("full_proxy_bypass_ru", "Полный VPN без РФ");
  o.value("exclusion", "Выключить VPN");

  o = section.option(
    form.ListValue,
    "proxy_config_type",
    _("Configuration Type"),
    "HarpyNet использует ссылку подписки для загрузки и обновления серверов.",
  );
  o.value("subscription", "Подписка");
  o.default = "subscription";
  o.depends("connection_type", "proxy");
  o.depends("connection_type", "full_proxy");
  o.depends("connection_type", "full_proxy_bypass_ru");

  o = section.option(
    form.Value,
    "subscription_url",
    "Подписка",
    "Ссылка подписки HarpyNet. Список серверов, авторизация устройства и информация о подписке обновляются автоматически.",
  );
  o.depends("proxy_config_type", "subscription");
  o.rmempty = false;
  o.validate = function (section_id, value) {
    if (!value || value.length === 0) {
      return _("Subscription URL cannot be empty");
    }

    const validation = main.validateUrl(value);

    if (validation.valid) {
      return true;
    }

    return validation.message;
  };

  o = section.option(
    form.Flag,
    "enable_udp_over_tcp",
    _("UDP over TCP"),
    _("Applicable for SOCKS and Shadowsocks proxy"),
  );
  o.default = "0";
  o.depends("connection_type", "proxy");
  o.depends("connection_type", "full_proxy");
  o.depends("connection_type", "full_proxy_bypass_ru");
  o.rmempty = false;

  o = section.option(
    form.DynamicList,
    "community_lists",
    "Готовые списки",
    "Выберите готовые списки для маршрутизации доменов и IP" +
      ' <a href="https://github.com/sentiox/sentinel-lists" target="_blank">github.com/sentiox/sentinel-lists</a>',
  );
  o.placeholder = "Выберите список";
  Object.entries(main.DOMAIN_LIST_OPTIONS).forEach(([key, label]) => {
    o.value(key, _(label));
  });
  o.rmempty = true;
  let lastValues = [];
  let isProcessing = false;

  o.onchange = function (ev, section_id, value) {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const values = Array.isArray(value) ? value : [value];
      let newValues = [...values];
      let notifications = [];

      const selectedRegionalOptions = main.REGIONAL_OPTIONS.filter((opt) =>
        newValues.includes(opt),
      );

      if (selectedRegionalOptions.length > 1) {
        const lastSelected =
          selectedRegionalOptions[selectedRegionalOptions.length - 1];
        const removedRegions = selectedRegionalOptions.slice(0, -1);
        newValues = newValues.filter(
          (v) => v === lastSelected || !main.REGIONAL_OPTIONS.includes(v),
        );
        notifications.push(
          E("p", {}, [
            E("strong", {}, _("Regional options cannot be used together")),
            E("br"),
            _(
              "Warning: %s cannot be used together with %s. Previous selections have been removed.",
            ).format(removedRegions.join(", "), lastSelected),
          ]),
        );
      }

      if (newValues.includes("russia_inside")) {
        const removedServices = newValues.filter(
          (v) => !main.ALLOWED_WITH_RUSSIA_INSIDE.includes(v),
        );
        if (removedServices.length > 0) {
          newValues = newValues.filter((v) =>
            main.ALLOWED_WITH_RUSSIA_INSIDE.includes(v),
          );
          notifications.push(
            E("p", { class: "alert-message warning" }, [
              E("strong", {}, _("Russia inside restrictions")),
              E("br"),
              _(
                "Warning: Russia inside can only be used with %s. %s already in Russia inside and have been removed from selection.",
              ).format(
                main.ALLOWED_WITH_RUSSIA_INSIDE.map(
                  (key) => main.DOMAIN_LIST_OPTIONS[key],
                )
                  .filter((label) => label !== "Russia inside")
                  .join(", "),
                removedServices.join(", "),
              ),
            ]),
          );
        }
      }

      if (JSON.stringify(newValues.sort()) !== JSON.stringify(values.sort())) {
        this.getUIElement(section_id).setValue(newValues);
      }

      notifications.forEach((notification) =>
        ui.addNotification(null, notification),
      );
      lastValues = newValues;
    } catch (e) {
      console.error("Error in onchange handler:", e);
    } finally {
      isProcessing = false;
    }
  };

  o = section.option(
    form.ListValue,
    "user_domain_list_type",
    _("User Domain List Type"),
    _("Select the list type for adding custom domains"),
  );
  o.value("disabled", _("Disabled"));
  o.value("dynamic", _("Dynamic List"));
  o.value("text", _("Text List"));
  o.default = "disabled";
  o.rmempty = false;

  o = section.option(
    form.DynamicList,
    "user_domains",
    _("User Domains"),
    _(
      "Enter domain names without protocols, e.g. example.com or sub.example.com",
    ),
  );
  o.placeholder = "Domains list";
  o.depends("user_domain_list_type", "dynamic");
  o.rmempty = false;
  o.validate = function (section_id, value) {
    // Optional
    if (!value || value.length === 0) {
      return true;
    }

    const validation = main.validateDomain(value, true);

    if (validation.valid) {
      return true;
    }

    return validation.message;
  };

  o = section.option(
    form.TextValue,
    "user_domains_text",
    _("User Domains List"),
    _(
      "Enter domain names separated by commas, spaces, or newlines. You can add comments using //",
    ),
  );
  o.placeholder =
    "example.com, sub.example.com\n// Social networks\ndomain.com test.com // personal domains";
  o.depends("user_domain_list_type", "text");
  o.rows = 8;
  o.rmempty = false;
  o.validate = function (section_id, value) {
    // Optional
    if (!value || value.length === 0) {
      return true;
    }

    const domains = main.parseValueList(value);

    if (!domains.length) {
      return _(
        "At least one valid domain must be specified. Comments-only content is not allowed.",
      );
    }

    const { valid, results } = main.bulkValidate(domains, (row) =>
      main.validateDomain(row, true),
    );

    if (!valid) {
      const errors = results
        .filter((validation) => !validation.valid) // Leave only failed validations
        .map((validation) => `${validation.value}: ${validation.message}`); // Collect validation errors

      return [_("Validation errors:"), ...errors].join("\n");
    }

    return true;
  };

  o = section.option(
    form.ListValue,
    "user_subnet_list_type",
    _("User Subnet List Type"),
    _("Select the list type for adding custom subnets"),
  );
  o.value("disabled", _("Disabled"));
  o.value("dynamic", _("Dynamic List"));
  o.value("text", _("Text List"));
  o.default = "disabled";
  o.rmempty = false;

  o = section.option(
    form.DynamicList,
    "user_subnets",
    _("User Subnets"),
    _(
      "Enter subnets in CIDR notation (e.g. 103.21.244.0/22) or single IP addresses",
    ),
  );
  o.placeholder = "IP or subnet";
  o.depends("user_subnet_list_type", "dynamic");
  o.rmempty = false;
  o.validate = function (section_id, value) {
    // Optional
    if (!value || value.length === 0) {
      return true;
    }

    const validation = main.validateSubnet(value);

    if (validation.valid) {
      return true;
    }

    return validation.message;
  };

  o = section.option(
    form.TextValue,
    "user_subnets_text",
    _("User Subnets List"),
    _(
      "Enter subnets in CIDR notation or single IP addresses, separated by commas, spaces, or newlines. " +
        "You can add comments using //",
    ),
  );
  o.placeholder =
    "103.21.244.0/22\n// Google DNS\n8.8.8.8\n1.1.1.1/32, 9.9.9.9 // Cloudflare and Quad9";
  o.depends("user_subnet_list_type", "text");
  o.rows = 10;
  o.rmempty = false;
  o.validate = function (section_id, value) {
    // Optional
    if (!value || value.length === 0) {
      return true;
    }

    const subnets = main.parseValueList(value);

    if (!subnets.length) {
      return _(
        "At least one valid subnet or IP must be specified. Comments-only content is not allowed.",
      );
    }

    const { valid, results } = main.bulkValidate(subnets, main.validateSubnet);

    if (!valid) {
      const errors = results
        .filter((validation) => !validation.valid) // Leave only failed validations
        .map((validation) => `${validation.value}: ${validation.message}`); // Collect validation errors

      return [_("Validation errors:"), ...errors].join("\n");
    }

    return true;
  };

  o = section.option(
    form.DynamicList,
    "local_domain_lists",
    _("Local Domain Lists"),
    _("Specify the path to the list file located on the router filesystem"),
  );
  o.placeholder = "/path/file.lst";
  o.rmempty = true;
  o.validate = function (section_id, value) {
    // Optional
    if (!value || value.length === 0) {
      return true;
    }

    const validation = main.validatePath(value);

    if (validation.valid) {
      return true;
    }

    return validation.message;
  };

  o = section.option(
    form.DynamicList,
    "local_subnet_lists",
    _("Local Subnet Lists"),
    _("Specify the path to the list file located on the router filesystem"),
  );
  o.placeholder = "/path/file.lst";
  o.rmempty = true;
  o.validate = function (section_id, value) {
    // Optional
    if (!value || value.length === 0) {
      return true;
    }

    const validation = main.validatePath(value);

    if (validation.valid) {
      return true;
    }

    return validation.message;
  };

  o = section.option(
    form.DynamicList,
    "remote_domain_lists",
    _("Remote Domain Lists"),
    _("Specify remote URLs to download and use domain lists"),
  );
  o.placeholder = "https://example.com/domains.srs";
  o.rmempty = true;
  o.validate = function (section_id, value) {
    // Optional
    if (!value || value.length === 0) {
      return true;
    }

    const validation = main.validateUrl(value);

    if (validation.valid) {
      return true;
    }

    return validation.message;
  };

  o = section.option(
    form.DynamicList,
    "remote_subnet_lists",
    _("Remote Subnet Lists"),
    _("Specify remote URLs to download and use subnet lists"),
  );
  o.placeholder = "https://example.com/subnets.srs";
  o.rmempty = true;
  o.validate = function (section_id, value) {
    // Optional
    if (!value || value.length === 0) {
      return true;
    }

    const validation = main.validateUrl(value);

    if (validation.valid) {
      return true;
    }

    return validation.message;
  };

  const fullyRoutedIpOption = section.option(
    form.DynamicList,
    "fully_routed_ips",
    _("Fully Routed IPs"),
    _(
      "Specify local IP addresses or subnets whose traffic will always be routed through the configured route",
    ),
  );
  fullyRoutedIpOption.placeholder = "192.168.1.2 or 192.168.1.0/24";
  fullyRoutedIpOption.rmempty = true;
  fullyRoutedIpOption.depends("connection_type", "proxy");
  fullyRoutedIpOption.validate = function (section_id, value) {
    // Optional
    if (!value || value.length === 0) {
      return true;
    }

    const validation = main.validateSubnet(value);

    if (validation.valid) {
      return true;
    }

    return validation.message;
  };

  o = section.option(
    form.Flag,
    "mixed_proxy_enabled",
    _("Enable Mixed Proxy"),
    _(
      "Enable the mixed proxy, allowing this section to route traffic through both HTTP and SOCKS proxies",
    ),
  );
  o.default = "0";
  o.rmempty = false;
  o.depends("connection_type", "proxy");
  o.depends("connection_type", "full_proxy");
  o.depends("connection_type", "full_proxy_bypass_ru");

  o = section.option(
    form.Value,
    "mixed_proxy_port",
    _("Mixed Proxy Port"),
    _(
      "Specify the port number on which the mixed proxy will run for this section. " +
        "Make sure the selected port is not used by another service",
    ),
  );
  o.rmempty = false;
  o.depends("mixed_proxy_enabled", "1");

  o = section.option(
    form.Flag,
    "resolve_real_ip_for_routing",
    _("Resolve real IP for routing"),
    _("Enable DNS resolve to get real IP when routing"),
  );
  o.default = "0";
  o.rmempty = false;
  o.depends("connection_type", "proxy");
  o.depends("connection_type", "full_proxy");
  o.depends("connection_type", "full_proxy_bypass_ru");
}

const EntryPoint = {
  createSectionContent,
};

return baseclass.extend(EntryPoint);
