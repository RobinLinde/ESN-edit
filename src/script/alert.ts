export default function (
  element: HTMLDivElement,
  priority: string,
  message: string,
  safe = true
): HTMLDivElement {
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn-close";
  closeButton.setAttribute("data-bs-dismiss", "alert");
  closeButton.setAttribute("aria-label", "Close");

  const alert = document.createElement("div");
  if (safe) {
    alert.innerText = message;
  } else {
    alert.innerHTML = message;
  }
  alert.className = "alert alert-" + priority + " alert-dismissible fade show";
  alert.appendChild(closeButton);
  element.appendChild(alert);

  return element;
}
