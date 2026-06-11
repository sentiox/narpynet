"use strict";
"require baseclass";
"require form";
"require ui";
"require uci";
"require fs";
"require view.harpynet.main-v022 as main";

function createLogsContent(section) {
  const mount = section.option(form.DummyValue, "_mount_node");
  mount.rawhtml = true;
  mount.cfgvalue = function () {
    main.LogsTab.initController();
    return main.LogsTab.render();
  };
}

const EntryPoint = {
  createLogsContent,
};

return baseclass.extend(EntryPoint);
