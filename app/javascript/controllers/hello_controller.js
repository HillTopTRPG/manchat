import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    // noinspection JSUnresolvedVariable
    this.element.textContent = "Hello World!"
  }
}
