const isDarkTheme = (
  colorMode: 'light' | 'dark' | 'system',
  colorScheme: 'light' | 'dark',
): boolean => {
  return (
    colorMode === 'dark' || (colorMode === 'system' && colorScheme === 'dark')
  )
}

describe('isDarkTheme', () => {
  test('devuelve true cuando colorMode es dark', () => {
    expect(isDarkTheme('dark', 'light')).toBe(true)
  })

  test('devuelve true cuando colorMode es system y colorScheme es dark', () => {
    expect(isDarkTheme('system', 'dark')).toBe(true)
  })

  test('devuelve false cuando colorMode es light', () => {
    expect(isDarkTheme('light', 'light')).toBe(false)
  })

  test('devuelve false cuando colorMode es system y colorScheme no es dark', () => {
    expect(isDarkTheme('system', 'light')).toBe(false)
  })
})
