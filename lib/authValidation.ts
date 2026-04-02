const NAME_PATTERN =
  /^[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿÁÉÍÓÚáéíóúÑñ]+)*$/

export function validateNameField(label: string, value: string): string {
  const v = value.trim()
  if (!v) return `${label} es requerido`
  if (!NAME_PATTERN.test(v)) {
    return `${label} solo puede contener letras y espacios`
  }
  return ""
}

export function validateEmailField(value: string): string {
  const v = value.trim()
  if (!v) return "El correo electrónico es requerido"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return "Por favor ingresa un correo electrónico válido"
  }
  return ""
}

export function validateSignupPassword(value: string): string {
  if (!value) return "La contraseña es requerida"
  if (value.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres"
  }
  if (!/(?=.*[A-Z])/.test(value)) {
    return "La contraseña debe contener al menos una mayúscula"
  }
  if (!/(?=.*\d)/.test(value)) {
    return "La contraseña debe contener al menos un número"
  }
  if (!/(?=.*[@$!%*?&])/.test(value)) {
    return "La contraseña debe contener al menos un carácter especial (@$!%*?&)"
  }
  return ""
}

export const SIGNUP_PASSWORD_HINT =
  "Al menos 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)"
