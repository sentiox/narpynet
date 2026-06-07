"use strict";
"require form";
"require baseclass";
"require ui";
"require view.harpynet.main-v005 as main";

function createSectionContent(section) {
  let o = section.option(
    form.ListValue,
    "connection_type",
    _("Connection Type"),
    "Выберите: направлять трафик через HarpyNet или пропускать его напрямую",
  );
  o.value("proxy", "Proxy");
  o.value("exclusion", "Исключение");

  o = section.option(
    form.ListValue,
    "proxy_config_type",
    _("Configuration Type"),
    "HarpyNet использует ссылку подписки для загрузки и обновления серверов.",
  );
  o.value("subscription", "Подписка");
  o.default = "subscription";
  o.depends("connection_type", "proxy");

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
  o.rmempty = false;

  o = section.option(
    form.DynamicList,
    "community_lists",
    _("Community Lists"),
    _("Select a predefined list for routing") +
      ' <a href="https://github.com/sentiox/sentinel-lists" target="_blank">github.com/sentiox/sentinel-lists</a>',
  );
  o.placeholder = "Service list";
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

  o = section.option(
    form.DynamicList,
    "fully_routed_ips",
    _("Fully Routed IPs"),
    _(
      "Specify local IP addresses or subnets whose traffic will always be routed through the configured route",
    ),
  );
  o.placeholder = "192.168.1.2 or 192.168.1.0/24";
  o.rmempty = true;
  o.depends("connection_type", "proxy");
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
}

const EntryPoint = {
  createSectionContent,
};

return baseclass.extend(EntryPoint);
