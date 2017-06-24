declare module 'validate-element-name' {
  function validateElementName(name: string): {
    isValid: boolean,
    message: string | undefined
  }

  export = validateElementName;
}
