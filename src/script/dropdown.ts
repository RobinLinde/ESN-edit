interface Result {
  label: string;
  description: string;
  id: string;
}

export default function (
  results: Record<string, unknown>,
  dropdown: HTMLSelectElement,
  options: string[]
): void {
  if (results.length == 0) {
    dropdown.disabled = true;
  } else {
    dropdown.disabled = false;
    dropdown.innerHTML = "";
    for (let i = 0; i < results.length; i++) {
      const result = results[i] as Result;
      const option = document.createElement("option");
      option.innerHTML = result.label + " (" + result.description + ")";
      option.value = result.id;
      dropdown.appendChild(option);
    }
    if (options.length > 0) {
      setMultipleOptions(dropdown, options);
    }
  }
}

function setMultipleOptions(
  selectElement: HTMLSelectElement,
  values: Array<string>
) {
  const options = selectElement.options;
  let changedOptions = 0;
  for (let i = 0; i < options.length; i++) {
    if (values.includes(options[i].value)) {
      options[i].selected = true;
      changedOptions += 1;
    }
  }
  if (changedOptions > 0) {
    return true;
  } else {
    return false;
  }
}
