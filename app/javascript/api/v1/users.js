import $ from "jquery"
import axios from "axios"

async function fetch_verify(id, password) {
  try {
    const { data } = await axios.post(`${id}/verify`, { password })
    console.log(JSON.stringify(data, null, '  '))
  } catch (err) { }
}

$(() => {
  // noinspection JSCheckFunctionSignatures
  $("#verify_form input[type='submit']").click(event => {
    const id       = $("#api_v1_users tbody tr:first-child td:first-child").text()
    const password = $("#password").val()
    console.log(id, password)
    fetch_verify(id, password).then()
    event.preventDefault();
  })
})