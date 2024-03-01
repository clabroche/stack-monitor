export interface Theme {
  public?: boolean,
  name?: string,
  group?: string,
  base?: string,
  preview?: {
    background: Partial<{ backgroundColor: string }>,
    foreground1: Partial<{ backgroundColor: string }>,
    foreground2: Partial<{ backgroundColor: string }>,
    foreground3: Partial<{ backgroundColor: string }>,
    foreground4: Partial<{ backgroundColor: string }>,
  },
  rules: Partial<{
    system: Partial<{ backgroundColor: string, color: string }>,
    'system.terminal': Partial<{ backgroundColor: string, color: string, contrastRatio: number }>,
    'system.secondary': Partial<{ backgroundColor: string, color: string }>,
    'system.tertiary': Partial<{ color: string }>,
    'system.accent': Partial<{
      backgroundColor1: string,
      backgroundColor2: string,
      backgroundColor3: string,
      'backgroundColor1-secondary': string,
      'backgroundColor2-secondary': string,
      'backgroundColor3-secondary': string,
      'backgroundColor1-tertiary': string,
      'backgroundColor2-tertiary': string,
      'backgroundColor3-tertiary': string,
    }>,
    'system.border': Partial<{ borderColor: string }>,
    'system.sidebar': Partial<{ backgroundColor: string }>,
    'system.secondary-sidebar': Partial<{ backgroundColor: string }>,
    'system.sections': Partial<{ backgroundColor: string, innerShadow: string }>,
    'git.badge': Partial<{ backgroundColor: string, color: string }>,
    jsonviewer: Partial<{
      keyColor: string,
      valueKeyColor: string,
    }>,
  }>
}
