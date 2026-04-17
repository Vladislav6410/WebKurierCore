import { Select, Confirm, Input } from 'enquirer';
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
      name: 'location',
      message: 'Do you want to provide a location?',
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

    const addDomains = await new Confirm({
      name: 'domains',
      message: 'Restrict search by domains?',
      initial: false,
    }).run();

    if (addDomains) {
      const domains = await new Input({
        name: 'domains',
        message: 'Comma-separated domains',
        initial: next.domainFilters?.allowedDomains?.join(', ') ?? '',
      }).run();

      next.domainFilters = {
        allowedDomains: domains
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      };
    }

    return next;
  }
}