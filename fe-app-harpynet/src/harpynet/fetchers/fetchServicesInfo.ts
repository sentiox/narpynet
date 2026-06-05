import { HarpyNetShellMethods } from '../methods';
import { store } from '../services';

export async function fetchServicesInfo() {
  const [harpynet, singbox] = await Promise.all([
    HarpyNetShellMethods.getStatus(),
    HarpyNetShellMethods.getSingBoxStatus(),
  ]);

  if (!harpynet.success || !singbox.success) {
    store.set({
      servicesInfoWidget: {
        loading: false,
        failed: true,
        data: { singbox: 0, harpynet: 0 },
      },
    });
  }

  if (harpynet.success && singbox.success) {
    store.set({
      servicesInfoWidget: {
        loading: false,
        failed: false,
        data: { singbox: singbox.data.running, harpynet: harpynet.data.enabled },
      },
    });
  }
}
