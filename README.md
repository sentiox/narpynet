# HarpyNet

HarpyNet is an OpenWrt traffic routing package with a LuCI interface, sing-box core integration, selective domain/subnet routing, subscription support, and automated list updates.

## Features

- Selective routing for domains, subnets, local lists, remote lists, and community lists.
- sing-box based transparent proxying with FakeIP DNS support.
- Proxy URL, selector, urltest, custom outbound JSON, VPN interface, block, and exclusion modes.
- Subscription URL mode for raw/base64 URI subscriptions.
- Remnawave-friendly subscription downloads with `User-Agent`, `x-hwid`, `x-device-os`, `x-ver-os`, and `x-device-model` headers.
- Stable router HWID generated from the LAN/ethernet MAC address.
- Optional list downloads through the configured proxy.
- Community lists from [sentiox/sentinel-lists](https://github.com/sentiox/sentinel-lists).

## Install

```sh
sh <(wget -O - https://raw.githubusercontent.com/sentiox/narpynet/refs/heads/main/install.sh)
```

HarpyNet requires OpenWrt 24.10 or newer and at least 25 MB of free space.

## Subscription Mode

Set a section to `proxy_config_type 'subscription'` and provide `subscription_url`.

```uci
config section 'main'
        option connection_type 'proxy'
        option proxy_config_type 'subscription'
        option subscription_url 'https://example.com/sub'
        option subscription_mode 'selector'
        option enable_udp_over_tcp '0'
```

Supported subscription payloads are plain or base64 encoded lists containing URI links such as `vless://`, `trojan://`, `ss://`, `vmess://`, `hysteria2://`, `tuic://`, and `socks://`.

Use `subscription_mode 'urltest'` if HarpyNet should create a fastest-node group in addition to the selector.

## Lists

HarpyNet uses:

- Raw lists: `https://raw.githubusercontent.com/sentiox/sentinel-lists/main`
- Release assets: `https://github.com/sentiox/sentinel-lists/releases/latest/download`

## Commands

```sh
harpynet start
harpynet stop
harpynet restart
harpynet list_update
harpynet global_check
harpynet show_system_info
harpynet show_sing_box_config
```

## Repository

Main repository: [sentiox/narpynet](https://github.com/sentiox/narpynet)

## License

GPL-2.0-or-later.
