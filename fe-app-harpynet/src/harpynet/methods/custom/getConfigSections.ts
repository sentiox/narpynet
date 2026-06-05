import { HarpyNet } from '../../types';

export async function getConfigSections(): Promise<HarpyNet.ConfigSection[]> {
  return uci.load('harpynet').then(() => uci.sections('harpynet'));
}
