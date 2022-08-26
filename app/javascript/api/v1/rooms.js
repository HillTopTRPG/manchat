import $ from "jquery"
import axios from "axios"

async function fetch_verify(id, password) {
    try {
        const res = await axios.post(`${id}/verify`, { password })
        console.log(JSON.stringify(res.data))
    } catch (err) { }
}

$(() => {
    $("#verify_form input[type='submit']").click(event => {
        const id = $("#api_v1_rooms tbody tr:first-child td:first-child").text()
        const password = $("#password").val()
        console.log(id, password)
        fetch_verify(id, password)
        event.preventDefault();
    })
})