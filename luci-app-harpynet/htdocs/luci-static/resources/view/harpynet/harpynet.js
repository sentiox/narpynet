"use strict";
"require view";
"require form";
"require baseclass";
"require network";
"require view.harpynet.main as main";

// Settings content
"require view.harpynet.settings as settings";

// Sections content
"require view.harpynet.section as section";

// Dashboard content
"require view.harpynet.dashboard as dashboard";

// Diagnostic content
"require view.harpynet.diagnostic as diagnostic";

const EntryPoint = {
  async render() {
    main.injectGlobalStyles();

    const harpynetMap = new form.Map(
      "harpynet",
      _("HarpyNet Settings"),
      _("Configuration for HarpyNet service"),
    );
    // Enable tab views
    harpynetMap.tabbed = true;

    // Sections tab
    const sectionsSection = harpynetMap.section(
      form.TypedSection,
      "section",
      _("Sections"),
    );
    sectionsSection.anonymous = false;
    sectionsSection.addremove = true;
    sectionsSection.template = "cbi/simpleform";

    // Render section content
    section.createSectionContent(sectionsSection);

    // Settings tab
    const settingsSection = harpynetMap.section(
      form.TypedSection,
      "settings",
      _("Settings"),
    );
    settingsSection.anonymous = true;
    settingsSection.addremove = false;
    // Make it named [ config settings 'settings' ]
    settingsSection.cfgsections = function () {
      return ["settings"];
    };

    // Render settings content
    settings.createSettingsContent(settingsSection);

    // Diagnostic tab
    const diagnosticSection = harpynetMap.section(
      form.TypedSection,
      "diagnostic",
      _("Diagnostics"),
    );
    diagnosticSection.anonymous = true;
    diagnosticSection.addremove = false;
    diagnosticSection.cfgsections = function () {
      return ["diagnostic"];
    };

    // Render diagnostic content
    diagnostic.createDiagnosticContent(diagnosticSection);

    // Dashboard tab
    const dashboardSection = harpynetMap.section(
      form.TypedSection,
      "dashboard",
      _("Dashboard"),
    );
    dashboardSection.anonymous = true;
    dashboardSection.addremove = false;
    dashboardSection.cfgsections = function () {
      return ["dashboard"];
    };

    // Render dashboard content
    dashboard.createDashboardContent(dashboardSection);

    // Inject core service
    main.coreService();

    return harpynetMap.render();
  },
};

return view.extend(EntryPoint);
