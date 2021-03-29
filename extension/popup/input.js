class Input {
  constructor({ node, onUpdate }) {
    this.inputNode = node;

    this.onUpdate = onUpdate;

    this.inputNode.addEventListener('input', this.onChange.bind(this));
  }


  /* EVENT HANDLERS */

  onChange(e) {
    const value = e.target.value;
    this.onUpdate(value);
  }


  /* PUBLIC */
  GetValue() {
    return this.inputNode.value;
  }

  SetValue(value) {
    this.inputNode.value = value;
  }

  Enable() {
    this.inputNode.removeAttribute('disabled');
  }

  Disable() {
    this.inputNode.setAttribute('disabled', 'disabled');
  }

  Focus() {
    this.inputNode.focus();
  }

  Blur() {
    this.inputNode.blur();
  }

  SelectAll() {
    this.inputNode.setSelectionRange(0, this.inputNode.value.length);
  }
}
