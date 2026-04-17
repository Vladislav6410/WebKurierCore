import { Confirm, Input, Select } from 'enquirer';
import { SearchMode } from '@webkurier/websearch-core/types/SearchMode';

export class PromptEngine {
  static async enrichConfig(config: any): Promise<any> {
    const next = { ...config };

    if (!next.mode) {
      next.mode = await new Select({
        name: 'mode',
        message: 'Choose search mode',
        choices: [SearchMode.FAST, SearchMode.AGENTIC, SearchMode.DEEP],
      }).run();
    }

    const addLocation = await new Confirm({
      name: 'addLocation',
      message: 'Do you want to specify location settings?',
      initial: false,
    }).run();

    if (addLocation) {
      const country = await new Input({
        name: 'country',
        message: 'Country code (e.g. DE, US)',
        initial: next.location?.country ?? '',
      }).run();

      const city = await new Input({
        name: 'city',
        message: 'City (optional)',
        initial: next.location?.city ?? '',
      }).run();

      const timezone = await new Input({
        name: 'timezone',
        message: 'Timezone (optional)',
        initial: next.location?.timezone ?? '',
      }).run();

      next.location = {
        ...next.location,
        country: country || next.location?.country,
        city: city || undefined,
        timezone: timezone || undefined,
      };
    }

    const addDomainFilters = await new Confirm({
      name: 'addDomainFilters',
      message: 'Do you want to restrict search by domains?',
      initial: false,
    }).run();

    if (addDomainFilters) {
      const domainsInput = await new Input({
        name: 'domains',
        message: 'Comma-separated domains',
        initial: next.domainFilters?.allowedDomains?.join(', ') ?? '',
      }).run();

      const allowedDomains = domainsInput
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => d.replace(/^https?:\/\//, '').replace(/\/$/, ''));

      next.domainFilters = allowedDomains.length
        ? { allowedDomains }
        : undefined;
    }

    return next;
  }
}
