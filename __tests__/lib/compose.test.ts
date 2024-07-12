// Define la función onNewLink con las dependencias simuladas
const onNewLink = (
  uri: string,
  quote: boolean | undefined,
  extLink: {uri: string; isLoading: boolean} | null,
  setExtLink: (
    value: React.SetStateAction<{uri: string; isLoading: boolean} | null>,
  ) => void,
) => {
  if (quote) return
  if (extLink != null) return
  setExtLink({uri, isLoading: true})
}

// Describe las pruebas para onNewLink
describe('onNewLink', () => {
  test('debería llamar a setExtLink con uri y isLoading true cuando quote es falso y extLink es nulo', () => {
    // Simula una función mock para setExtLink
    const mockSetExtLink = jest.fn()

    // Llama a la función con los parámetros simulados
    onNewLink('https://example.com', undefined, null, mockSetExtLink)

    // Verifica si setExtLink fue llamado con los argumentos esperados
    expect(mockSetExtLink).toHaveBeenCalledWith({
      uri: 'https://example.com',
      isLoading: true,
    })
  })

  test('no debería llamar a setExtLink cuando quote es verdadero', () => {
    // Simula una función mock para setExtLink
    const mockSetExtLink = jest.fn()

    // Llama a la función con quote como verdadero
    onNewLink('https://example.com', true, null, mockSetExtLink)

    // Verifica que setExtLink no fue llamado
    expect(mockSetExtLink).not.toHaveBeenCalled()
  })

  test('no debería llamar a setExtLink cuando extLink no es nulo', () => {
    // Simula una función mock para setExtLink
    const mockSetExtLink = jest.fn()

    // Llama a la función con extLink no nulo
    onNewLink(
      'https://example.com',
      undefined,
      {uri: 'https://previouslink.com', isLoading: false},
      mockSetExtLink,
    )

    // Verifica que setExtLink no fue llamado
    expect(mockSetExtLink).not.toHaveBeenCalled()
  })
})
