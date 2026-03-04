export enum Frequency {
  ONCE_DAILY = 'ONCE_DAILY',
  TWICE_DAILY = 'TWICE_DAILY',
  THREE_TIMES_DAILY = 'THREE_TIMES_DAILY',
  EVERY_6_HOURS = 'EVERY_6_HOURS',
  EVERY_8_HOURS = 'EVERY_8_HOURS',
  EVERY_12_HOURS = 'EVERY_12_HOURS',
  WEEKLY = 'WEEKLY'
}

export const frequencyLabels: { [key in Frequency]: string } = {
  [Frequency.ONCE_DAILY]: 'Once Daily',
  [Frequency.TWICE_DAILY]: 'Twice Daily',
  [Frequency.THREE_TIMES_DAILY]: 'Three Times Daily',
  [Frequency.EVERY_6_HOURS]: 'Every 6 Hours',
  [Frequency.EVERY_8_HOURS]: 'Every 8 Hours',
  [Frequency.EVERY_12_HOURS]: 'Every 12 Hours',
  [Frequency.WEEKLY]: 'Weekly'
};
