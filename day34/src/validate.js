export function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "We need a name for the delivery";
  }

  const phone = form.phone.replace(/\s+/g, "");
  if (!/^(?:\+251|0)9\d{8}$/.test(phone)) {
    errors.phone = "Use 09… or +2519… (TeleBirr number)";
  }

  if (!form.area) {
    errors.area = "Choose a delivery area";
  }

  return errors;
}
